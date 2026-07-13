import prisma from "../src/config/prisma.js";
async function main() {
  const targetClerkId = "49385727-9511-4ed8-8049-e974f5511533"; // DELETE THIS
  //   await prisma.material.deleteMany({});
  console.log("🪨 Synchronizing material items...");
  const materialsList = [
    { name: "10mm", isActive: true },
    { name: "20mm", isActive: true },
    { name: "6mm", isActive: true },
    { name: "Dust", isActive: true },
    { name: "GSB", isActive: true },
    { name: "CRM", isActive: true },
    { name: "Mix", isActive: true },
  ];

  for (const mat of materialsList) {
    await prisma.material.upsert({
      where: { name: mat.name },
      update: { isActive: mat.isActive },
      create: mat,
    });
  }

  const dbMaterials = await prisma.material.findMany();
  const matMap = {};
  dbMaterials.forEach((m) => {
    matMap[m.name] = m.id;
  });

  console.log("📋 Mapped DB IDs:", matMap);

  // 3. 📊 TRANSACTION COLLECTION WITH ISOLATED INSERTION
  await prisma.voidRequest.deleteMany();
  await prisma.transaction.deleteMany();
  console.log("🔄 Injecting transactions with dynamic ID tracking...");

  const rawTransactions = [
    {
      vehicleNumber: "MP09HE1234",
      customerName: "Indore Infra Contractors Ltd",
      quantity: 600,
      rateApplied: 15.0,
      paymentType: "CASH",
      totalAmount: 9000,
      materialName: "Mix",
      receiptNumber: "1001",
      createdAt: new Date("2026-06-27T20:49:55.461Z"),
    },
    {
      vehicleNumber: "MP09HF4588",
      customerName: "Sharma Logistics & Co",
      quantity: 420,
      rateApplied: 35.0,
      paymentType: "CREDIT",
      totalAmount: 14700,
      materialName: "20mm",
      receiptNumber: "1002",
      createdAt: new Date("2026-06-28T09:15:00.000Z"),
    },
    {
      vehicleNumber: "MP04HE7711",
      customerName: "Bhopal Smart City Project",
      quantity: 850,
      rateApplied: 25.0,
      paymentType: "CREDIT",
      totalAmount: 21250,
      materialName: "GSB",
      receiptNumber: "1003",
      createdAt: new Date("2026-06-28T14:30:22.000Z"),
    },
    {
      vehicleNumber: "MP13GA9214",
      customerName: "Ujjain Development Authority",
      quantity: 350,
      rateApplied: 30.0,
      paymentType: "CASH",
      totalAmount: 10500,
      materialName: "10mm",
      receiptNumber: "1004",
      createdAt: new Date("2026-06-29T11:05:45.000Z"),
    },
    {
      vehicleNumber: "MP09HE1234",
      customerName: "Indore Infra Contractors Ltd",
      quantity: 580,
      rateApplied: 15.0,
      paymentType: "CASH",
      totalAmount: 8700,
      materialName: "Mix",
      receiptNumber: "1005",
      createdAt: new Date("2026-06-30T17:20:10.000Z"),
    },
    {
      vehicleNumber: "MP41HA0963",
      customerName: "Dewas Mega Highway Builders",
      quantity: 1200,
      rateApplied: 23.0,
      paymentType: "CREDIT",
      totalAmount: 27600,
      site: "Bypass Toll Plaza Depot",
      materialName: "CRM",
      receiptNumber: "1006",
      createdAt: new Date("2026-07-01T08:44:19.000Z"),
    },
    {
      vehicleNumber: "MP09HG2231",
      customerName: "Rishabh Stone Traders",
      quantity: 280,
      rateApplied: 25.0,
      paymentType: "CASH",
      totalAmount: 7000,
      site: "Rau Circle Commercial Complex",
      materialName: "Dust",
      receiptNumber: "1007",
      createdAt: new Date("2026-07-01T13:12:00.000Z"),
    },
    {
      vehicleNumber: "MP04HE9966",
      customerName: "Bhopal Smart City Project",
      quantity: 900,
      rateApplied: 25.0,
      paymentType: "CREDIT",
      totalAmount: 22500,
      site: "Hoshangabad Road Site",
      materialName: "GSB",
      receiptNumber: "1008",
      createdAt: new Date("2026-07-02T10:02:55.000Z"),
    },
    {
      vehicleNumber: "MP09HF4588",
      customerName: "Sharma Logistics & Co",
      quantity: 450,
      rateApplied: 35.0,
      paymentType: "CREDIT",
      totalAmount: 15750,
      site: "Vijay Nagar Flyover",
      materialName: "20mm",
      receiptNumber: "1009",
      createdAt: new Date("2026-07-02T15:40:00.000Z"),
    },
    {
      vehicleNumber: "MP13GA5521",
      customerName: "Avantika Buildcon",
      quantity: 500,
      rateApplied: 32.0,
      paymentType: "CASH",
      totalAmount: 16000,
      site: "Ujjain Ring Road",
      materialName: "6mm",
      receiptNumber: "1010",
      createdAt: new Date("2026-07-03T07:30:12.000Z"),
    },
    {
      vehicleNumber: "MP09HE8899",
      customerName: "Indore RMC Plant (Palasia)",
      quantity: 750,
      rateApplied: 35.0,
      paymentType: "CREDIT",
      totalAmount: 26250,
      site: "Palasia Mix Yard",
      materialName: "20mm",
      receiptNumber: "1011",
      createdAt: new Date("2026-07-03T11:15:34.000Z"),
    },
    {
      vehicleNumber: "MP09HG2231",
      customerName: "Rishabh Stone Traders",
      quantity: 310,
      rateApplied: 25.0,
      paymentType: "CASH",
      totalAmount: 7750,
      site: "Rau Circle Commercial Complex",
      materialName: "Dust",
      receiptNumber: "1022",
      createdAt: new Date("2026-07-03T16:50:22.000Z"),
    },
    {
      vehicleNumber: "MP41HA0963",
      customerName: "Dewas Mega Highway Builders",
      quantity: 1150,
      rateApplied: 23.0,
      paymentType: "CREDIT",
      totalAmount: 26450,
      site: "Bypass Toll Plaza Depot",
      materialName: "CRM",
      receiptNumber: "1013",
      createdAt: new Date("2026-07-04T09:10:00.000Z"),
    },
    {
      vehicleNumber: "MP09HE1234",
      customerName: "Indore Infra Contractors Ltd",
      quantity: 610,
      rateApplied: 15.0,
      paymentType: "CASH",
      totalAmount: 9150,
      site: "Super Corridor Site A",
      materialName: "Mix",
      receiptNumber: "1014",
      createdAt: new Date("2026-07-04T12:05:11.000Z"),
    },
    {
      vehicleNumber: "MP13GA9214",
      customerName: "Ujjain Development Authority",
      quantity: 380,
      rateApplied: 30.0,
      paymentType: "CASH",
      totalAmount: 11400,
      site: "Mahakal Lok Phase 2",
      materialName: "10mm",
      receiptNumber: "1015",
      createdAt: new Date("2026-07-04T15:22:40.000Z"),
    },
    {
      vehicleNumber: "MP09HE8899",
      customerName: "Indore RMC Plant (Palasia)",
      quantity: 720,
      rateApplied: 35.0,
      paymentType: "CREDIT",
      totalAmount: 25200,
      materialName: "20mm",
      receiptNumber: "1016",
      createdAt: new Date("2026-07-05T08:30:00.000Z"),
    },
    {
      vehicleNumber: "MP04HE7711",
      customerName: "Bhopal Smart City Project",
      quantity: 800,
      rateApplied: 25.0,
      paymentType: "CREDIT",
      totalAmount: 20000,
      site: "Hoshangabad Road Site",
      materialName: "GSB",
      receiptNumber: "1017",
      createdAt: new Date("2026-07-05T11:45:19.000Z"),
    },
    {
      vehicleNumber: "MP13GA5521",
      customerName: "Avantika Buildcon",
      quantity: 480,
      rateApplied: 32.0,
      paymentType: "CASH",
      totalAmount: 15360,
      site: "Ujjain Ring Road",
      materialName: "6mm",
      receiptNumber: "1018",
      createdAt: new Date("2026-07-05T14:10:05.000Z"),
    },
    {
      vehicleNumber: "MP09HF4588",
      customerName: "Sharma Logistics & Co",
      quantity: 440,
      rateApplied: 35.0,
      paymentType: "CREDIT",
      totalAmount: 15400,
      materialName: "20mm",
      receiptNumber: "1019",
      createdAt: new Date("2026-07-05T16:55:50.000Z"),
    },
    {
      vehicleNumber: "MP09HG2231",
      customerName: "Rishabh Stone Traders",
      quantity: 300,
      rateApplied: 25.0,
      paymentType: "CASH",
      totalAmount: 7500,
      site: "Rau Circle Commercial Complex",
      materialName: "Dust",
      receiptNumber: "1020",
      createdAt: new Date("2026-07-05T17:40:00.000Z"),
    },
  ];

  console.log("🔄 Injecting transactions one by one...");
  let successCount = 0;

  for (let i = 0; i < rawTransactions.length; i++) {
    const tx = rawTransactions[i];
    const resolvedId = matMap[tx.materialName];

    try {
      await prisma.transaction.create({
        data: {
          vehicleNumber: tx.vehicleNumber,
          customerName: tx.customerName,
          quantity: tx.quantity,
          rateApplied: tx.rateApplied,
          paymentType: tx.paymentType,
          totalAmount: tx.totalAmount,
          site: tx.site,
          clerk: {
            connect: { id: targetClerkId },
          },
          material: {
            connect: { id: resolvedId },
          },
          receiptNumber: tx.receiptNumber,
          createdAt: tx.createdAt,
        },
      });
      successCount++;
    } catch (err) {
      console.error(
        `\n🚨 INSERTION CRASH at index [${i}] (Receipt #${tx.receiptNumber})`,
      );
      console.error(`   Material Name: ${tx.materialName}`);
      console.error(`   Resolved UUID: ${resolvedId}`);
      console.error(`   Error Message: ${err.message}\n`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Success! Seed injected count: ${successCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
