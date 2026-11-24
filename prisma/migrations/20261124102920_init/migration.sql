-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "nim" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jurusan" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_nim_key" ON "students"("nim");
