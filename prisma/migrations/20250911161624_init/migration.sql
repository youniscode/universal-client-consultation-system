-- CreateEnum
CREATE TYPE "public"."ClientType" AS ENUM ('INDIVIDUAL', 'SMALL_BUSINESS', 'CORPORATION', 'NONPROFIT', 'STARTUP', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('WEBSITE', 'ECOMMERCE', 'WEB_APP', 'PORTFOLIO', 'BLOG', 'SAAS', 'API', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ComplexityLevel" AS ENUM ('SIMPLE', 'MODERATE', 'COMPLEX', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."BudgetRange" AS ENUM ('UNDER_5K', 'RANGE_5K_TO_15K', 'RANGE_15K_TO_50K', 'OVER_50K');

-- CreateEnum
CREATE TYPE "public"."Timeline" AS ENUM ('RUSH', 'STANDARD', 'EXTENDED', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN', 'SCALE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "public"."Phase" AS ENUM ('DISCOVERY', 'AUDIENCE', 'FUNCTIONAL', 'TECH', 'DESIGN', 'CONTENT', 'STACK');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientType" "public"."ClientType" NOT NULL,
    "industry" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectType" "public"."ProjectType" NOT NULL,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "complexity" "public"."ComplexityLevel" NOT NULL DEFAULT 'MODERATE',
    "budget" "public"."BudgetRange",
    "timeline" "public"."Timeline",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Questionnaire" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "phase" "public"."Phase" NOT NULL,
    "order" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "options" JSONB,
    "showIf" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Response" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "html" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Client_ownerId_idx" ON "public"."Client"("ownerId");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "public"."Project"("clientId");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_idx" ON "public"."Question"("questionnaireId");

-- CreateIndex
CREATE INDEX "Question_phase_order_idx" ON "public"."Question"("phase", "order");

-- CreateIndex
CREATE INDEX "Response_projectId_idx" ON "public"."Response"("projectId");

-- CreateIndex
CREATE INDEX "Response_questionId_idx" ON "public"."Response"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_projectId_questionId_key" ON "public"."Response"("projectId", "questionId");

-- CreateIndex
CREATE INDEX "Proposal_projectId_idx" ON "public"."Proposal"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_projectId_version_key" ON "public"."Proposal"("projectId", "version");

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
