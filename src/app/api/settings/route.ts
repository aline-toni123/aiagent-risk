import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const existingSettings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    if (existingSettings.length > 0) {
      return NextResponse.json(existingSettings[0]);
    }

    // Create default settings if doesn't exist
    const defaultSettings = {
      userId: session.user.id,
      emailNotifications: true,
      themePreference: 'system',
      riskThreshold: 700,
      createdAt: new Date().toISOString()
    };

    const newSettings = await db.insert(userSettings)
      .values(defaultSettings)
      .returning();

    return NextResponse.json(newSettings[0]);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { emailNotifications, themePreference, riskThreshold } = requestBody;

    // Validation
    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
      return NextResponse.json({ 
        error: "emailNotifications must be a boolean",
        code: "INVALID_EMAIL_NOTIFICATIONS" 
      }, { status: 400 });
    }

    if (themePreference !== undefined && !['light', 'dark', 'system'].includes(themePreference)) {
      return NextResponse.json({ 
        error: "themePreference must be one of 'light', 'dark', 'system'",
        code: "INVALID_THEME_PREFERENCE" 
      }, { status: 400 });
    }

    if (riskThreshold !== undefined && (typeof riskThreshold !== 'number' || riskThreshold < 0 || riskThreshold > 1000)) {
      return NextResponse.json({ 
        error: "riskThreshold must be a number between 0 and 1000",
        code: "INVALID_RISK_THRESHOLD" 
      }, { status: 400 });
    }

    // Check if settings exist
    const existingSettings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    if (existingSettings.length > 0) {
      // Update existing settings
      const updates: any = {};
      if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;
      if (themePreference !== undefined) updates.themePreference = themePreference;
      if (riskThreshold !== undefined) updates.riskThreshold = riskThreshold;

      const updated = await db.update(userSettings)
        .set(updates)
        .where(eq(userSettings.userId, session.user.id))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Create new settings (upsert pattern)
      const newSettings = {
        userId: session.user.id,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        themePreference: themePreference !== undefined ? themePreference : 'system',
        riskThreshold: riskThreshold !== undefined ? riskThreshold : 700,
        createdAt: new Date().toISOString()
      };

      const created = await db.insert(userSettings)
        .values(newSettings)
        .returning();

      return NextResponse.json(created[0]);
    }
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}