import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barry0719@gmail.com';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await currentUser();
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;

        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query params
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || 'all'; // 'all' | 'redeemed' | 'available'

        const trialsRef = collection(db, 'trial_tokens');
        const q = query(trialsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        let trials = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Serialize dates safely
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                linkExpiresAt: data.linkExpiresAt?.toDate?.()?.toISOString() || data.linkExpiresAt,
                redeemedAt: data.redeemedAt?.toDate?.()?.toISOString() || data.redeemedAt,
            };
        });

        // Filter in memory (ok for < few thousand records)
        if (status === 'redeemed') {
            trials = trials.filter((t: any) => t.redeemedBy);
        } else if (status === 'available') {
            trials = trials.filter((t: any) => !t.redeemedBy && new Date(t.linkExpiresAt) > new Date());
        } else if (status === 'expired') {
            trials = trials.filter((t: any) => !t.redeemedBy && new Date(t.linkExpiresAt) <= new Date());
        }

        // Pagination
        const total = trials.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedTrials = trials.slice(startIndex, startIndex + limit);

        // Enrich with user details from Clerk
        const redeemedUserIds = [...new Set(paginatedTrials.map((t: any) => t.redeemedBy).filter(Boolean))];

        if (redeemedUserIds.length > 0) {
            try {
                // Fetch users in batch (or individually if batch not supported nicely in this version)
                // clerkClient.users.getUserList supports retrieving by id? No, usually separate calls or maybe query.
                // For simplicity and safety with rate limits, we'll map.
                const client = await clerkClient();
                const users = await client.users.getUserList({
                    userId: redeemedUserIds as string[]
                });

                const userMap = new Map(users.data.map(u => [u.id, u]));

                paginatedTrials.forEach((t: any) => {
                    if (t.redeemedBy && userMap.has(t.redeemedBy)) {
                        const u = userMap.get(t.redeemedBy);
                        t.redeemedEmail = u?.emailAddresses?.[0]?.emailAddress;
                        t.redeemedName = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
                        t.redeemedImageUrl = u?.imageUrl;
                    }
                });

            } catch (err) {
                console.error('Error fetching Clerk users:', err);
                // Continue without user details if it fails
            }
        }

        return NextResponse.json({
            trials: paginatedTrials,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching trials:', error);
        return NextResponse.json({ error: 'Failed to fetch trials' }, { status: 500 });
    }
}
