import { NextResponse } from 'next/server';
import { listCompanies } from '../../../lib/companies';

// Public, unauthenticated — just exposes the real distinct-company count so the
// homepage's "X Startups" claim uses the same source of truth as /companies,
// instead of reusing the founder/entry count (a different, larger number).
export async function GET() {
  const companies = await listCompanies();
  return NextResponse.json({ companyCount: companies.length });
}
