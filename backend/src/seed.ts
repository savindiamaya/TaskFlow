import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "./lib/prisma.js";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@taskflow.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "System Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  const demoEmail = "demo@taskflow.com";
  const demoHash = await bcrypt.hash("Demo@12345", 12);
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: "Demo User",
      email: demoEmail,
      passwordHash: demoHash,
      role: "USER",
    },
  });

  const existingTasks = await prisma.task.count();
  if (existingTasks === 0) {
    const samples = [
      {
        title: "Design kanban board layout",
        description: "Create responsive three-column board with drag handles.",
        status: "DONE" as const,
        priority: "HIGH" as const,
        tags: ["Feature", "Frontend"],
        assigneeId: demo.id,
        creatorId: admin.id,
        position: 1,
      },
      {
        title: "Implement JWT authentication",
        description: "Secure login/register with bcrypt hashing and role checks.",
        status: "DOING" as const,
        priority: "HIGH" as const,
        tags: ["Feature", "Backend"],
        assigneeId: demo.id,
        creatorId: demo.id,
        position: 1,
        dueDate: new Date(Date.now() + 2 * 86400000),
      },
      {
        title: "Add due-date reminders",
        description: "Notify assignees when tasks are due soon or overdue.",
        status: "TODO" as const,
        priority: "MEDIUM" as const,
        tags: ["Feature", "Urgent"],
        assigneeId: null,
        creatorId: admin.id,
        position: 1,
        dueDate: new Date(Date.now() - 86400000),
      },
      {
        title: "Write API documentation",
        description: "Document endpoints, env vars and seed credentials in README.",
        status: "TODO" as const,
        priority: "LOW" as const,
        tags: ["Documentation"],
        assigneeId: null,
        creatorId: demo.id,
        position: 2,
      },
    ];

    for (const sample of samples) {
      await prisma.task.create({ data: sample });
    }
  }

  console.log("Seed complete");
  console.log(`Admin: ${email} / ${password}`);
  console.log(`Demo user: ${demoEmail} / Demo@12345`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
