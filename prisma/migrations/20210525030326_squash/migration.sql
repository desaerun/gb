-- CreateTable
CREATE TABLE `Guild` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guild_unique_name`(`id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel` (
    `id` VARCHAR(30) NOT NULL,
    `guildId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `unique_channel`(`id`, `guildId`, `name`),
    INDEX `guild`(`guildId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Author` (
    `id` VARCHAR(30) NOT NULL,
    `displayName` VARCHAR(255),
    `avatarUrl` VARCHAR(255),
    `isBot` BOOLEAN NOT NULL DEFAULT false,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(30) NOT NULL,
    `guildId` VARCHAR(30) NOT NULL,
    `channelId` VARCHAR(30) NOT NULL,
    `authorId` VARCHAR(30) NOT NULL,
    `content` TEXT,
    `timestamp` DATETIME(3) NOT NULL,
    `lastEditTimestamp` DATETIME(3),
    `deletedAt` DATETIME(3),
    `deletedBy` VARCHAR(255),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `author`(`authorId`),
    INDEX `channel`(`channelId`),
    INDEX `guild`(`guildId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageEditHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(30) NOT NULL,
    `newContent` TEXT,
    `oldContent` TEXT,
    `editTimestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageAttachment` (
    `id` VARCHAR(30) NOT NULL,
    `messageId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `proxyUrl` VARCHAR(255),
    `size` BIGINT UNSIGNED NOT NULL,
    `height` INTEGER UNSIGNED,
    `width` INTEGER UNSIGNED,
    `timestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BotDm` (
    `id` VARCHAR(30) NOT NULL,
    `authorId` VARCHAR(30) NOT NULL,
    `conversationId` VARCHAR(30) NOT NULL,
    `content` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `lastEditTimestamp` DATETIME(3),
    `deletedAt` DATETIME(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `author`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DmAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `proxyUrl` VARCHAR(255),
    `size` BIGINT UNSIGNED NOT NULL,
    `height` INTEGER UNSIGNED,
    `width` INTEGER UNSIGNED,
    `timestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DmEditHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(30) NOT NULL,
    `newContent` TEXT,
    `oldContent` TEXT,
    `editTimestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CryptoWatcher` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `index` INTEGER UNSIGNED,
    `startingPrice` DOUBLE NOT NULL,
    `targetPrice` DOUBLE NOT NULL,
    `requested` DOUBLE NOT NULL,
    `direction` ENUM('UP', 'DOWN') NOT NULL,
    `watcherType` ENUM('FIXED', 'CHANGE', 'PERCENT_CHANGE') NOT NULL,
    `alertChannelId` VARCHAR(30) NOT NULL,
    `authorId` VARCHAR(30) NOT NULL,
    `triggeredAt` DATETIME(3),
    `mentionIds` VARCHAR(191),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AuthorToGuild` (
    `A` VARCHAR(30) NOT NULL,
    `B` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `_AuthorToGuild_AB_unique`(`A`, `B`),
    INDEX `_AuthorToGuild_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MessageAttachment` ADD FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageEditHistory` ADD FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DmAttachment` ADD FOREIGN KEY (`messageId`) REFERENCES `BotDm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DmEditHistory` ADD FOREIGN KEY (`messageId`) REFERENCES `BotDm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CryptoWatcher` ADD FOREIGN KEY (`alertChannelId`) REFERENCES `Channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CryptoWatcher` ADD FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorToGuild` ADD FOREIGN KEY (`A`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorToGuild` ADD FOREIGN KEY (`B`) REFERENCES `Guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BotDm` ADD FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
