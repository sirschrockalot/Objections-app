#!/bin/bash
# Script to update remaining API routes to use JWT authentication
# This is a helper script - routes should be updated manually for better control

echo "Updating API routes to use JWT authentication..."
echo "Please update the following files manually:"
echo "- app/api/data/practice-sessions/route.ts"
echo "- app/api/data/points/route.ts"
echo "- app/api/data/review-schedules/route.ts"
echo "- app/api/data/confidence-ratings/route.ts"
echo "- app/api/data/notes/route.ts"
echo "- app/api/data/templates/route.ts"
echo "- app/api/data/learning-paths/route.ts"
echo "- app/api/data/practice-history/route.ts"
echo "- app/api/data/voice-sessions/route.ts"
echo "- app/api/auth/email/route.ts"
echo "- app/api/auth/stats/route.ts"
echo "- app/api/auth/activities/route.ts"
echo "- app/api/migrate/route.ts"
echo ""
echo "Pattern to replace:"
echo "  const userId = request.headers.get('x-user-id');"
echo "  if (!userId) { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }"
echo ""
echo "With:"
echo "  const auth = await requireAuth(request);"
echo "  if (!auth.authenticated) { return createAuthErrorResponse(auth); }"
echo "  const userId = auth.userId!;"

