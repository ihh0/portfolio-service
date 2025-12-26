-- CreateTable
CREATE TABLE `user` (
    `uid` VARCHAR(36) NOT NULL,
    `login_id` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `is_email_public` BOOLEAN NOT NULL DEFAULT true,
    `is_phone_public` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `role` ENUM('ROLE_USER', 'ROLE_ADMIN') NOT NULL DEFAULT 'ROLE_USER',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `user_login_id_key`(`login_id`),
    INDEX `user_display_name_idx`(`display_name`),
    INDEX `user_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `summary` VARCHAR(300) NULL,
    `content` LONGTEXT NULL,
    `content_format` ENUM('MARKDOWN', 'PLAIN_TEXT') NOT NULL DEFAULT 'MARKDOWN',
    `thumbnail_asset_id` INTEGER NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `likes_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,
    `user_uid` VARCHAR(36) NOT NULL,

    INDEX `project_title_idx`(`title`),
    INDEX `project_likes_count_idx`(`likes_count`),
    INDEX `project_user_uid_idx`(`user_uid`),
    INDEX `project_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `skill_name_key`(`name`),
    INDEX `skill_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experience` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_uid` VARCHAR(36) NOT NULL,
    `company` VARCHAR(100) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `employment_type` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE', 'OTHER') NOT NULL DEFAULT 'FULL_TIME',
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `experience_user_uid_idx`(`user_uid`),
    INDEX `experience_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_skill` (
    `project_id` INTEGER NOT NULL,
    `skill_id` INTEGER NOT NULL,

    PRIMARY KEY (`project_id`, `skill_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_like` (
    `project_id` INTEGER NOT NULL,
    `user_uid` VARCHAR(36) NOT NULL,

    INDEX `project_like_user_uid_idx`(`user_uid`),
    PRIMARY KEY (`project_id`, `user_uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_identity` (
    `id` VARCHAR(64) NOT NULL,
    `provider` ENUM('github', 'firebase') NOT NULL,
    `provider_user_id` VARCHAR(100) NOT NULL,
    `user_uid` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NULL,
    `username` VARCHAR(50) NULL,

    INDEX `auth_identity_user_uid_idx`(`user_uid`),
    UNIQUE INDEX `auth_identity_provider_provider_user_id_key`(`provider`, `provider_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_user_uid_fkey` FOREIGN KEY (`user_uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `experience` ADD CONSTRAINT `experience_user_uid_fkey` FOREIGN KEY (`user_uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_skill` ADD CONSTRAINT `project_skill_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_skill` ADD CONSTRAINT `project_skill_skill_id_fkey` FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_like` ADD CONSTRAINT `project_like_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_like` ADD CONSTRAINT `project_like_user_uid_fkey` FOREIGN KEY (`user_uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_identity` ADD CONSTRAINT `auth_identity_user_uid_fkey` FOREIGN KEY (`user_uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;
