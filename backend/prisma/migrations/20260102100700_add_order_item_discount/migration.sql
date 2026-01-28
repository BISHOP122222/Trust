-- CreateTable
CREATE TABLE "SerialItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "productId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SerialItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "costPrice" REAL,
    "serialNumber" TEXT,
    "serialItemId" TEXT,
    "warrantyExpiry" DATETIME,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_serialItemId_fkey" FOREIGN KEY ("serialItemId") REFERENCES "SerialItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("costPrice", "id", "orderId", "price", "productId", "quantity", "serialNumber", "warrantyExpiry") SELECT "costPrice", "id", "orderId", "price", "productId", "quantity", "serialNumber", "warrantyExpiry" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE UNIQUE INDEX "OrderItem_serialItemId_key" ON "OrderItem"("serialItemId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "sku" TEXT,
    "serialNumber" TEXT,
    "brand" TEXT,
    "imageUrl" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "costPrice" REAL,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT,
    "warrantyMonths" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSerialized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brand", "categoryId", "costPrice", "createdAt", "description", "id", "imageUrl", "isActive", "lowStockThreshold", "name", "price", "serialNumber", "sku", "stockQuantity", "supplierId", "updatedAt", "warrantyMonths") SELECT "brand", "categoryId", "costPrice", "createdAt", "description", "id", "imageUrl", "isActive", "lowStockThreshold", "name", "price", "serialNumber", "sku", "stockQuantity", "supplierId", "updatedAt", "warrantyMonths" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SerialItem_serialNumber_key" ON "SerialItem"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SerialItem_orderItemId_key" ON "SerialItem"("orderItemId");
