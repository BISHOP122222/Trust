-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BrandingSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL DEFAULT 'TRUST POS',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "footerMessage" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'BLUE',
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "enableCustomTheme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BrandingSettings" ("address", "businessName", "createdAt", "email", "footerMessage", "id", "logoUrl", "phone", "updatedAt") SELECT "address", "businessName", "createdAt", "email", "footerMessage", "id", "logoUrl", "phone", "updatedAt" FROM "BrandingSettings";
DROP TABLE "BrandingSettings";
ALTER TABLE "new_BrandingSettings" RENAME TO "BrandingSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
