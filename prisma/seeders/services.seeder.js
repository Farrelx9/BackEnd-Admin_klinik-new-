// Katalog layanan/tindakan gigi. Dipakai idempotent: kalau nama layanan
// sudah ada, dilewati — dijalankan ulang tidak akan menduplikasi data.
async function seedServices(prisma) {
  const services = [
    { name: "Scaling", description: "Pembersihan karang gigi", price: 300000 },
    { name: "Debridement/deep scaling 1 gigi", description: "Perawatan radang gusi dalam", price: 200000 },
    { name: "Metronidazole gel", description: "Obat kumur/gel untuk infeksi mulut", price: 150000 },
    { name: "Gingivektomi per gigi", description: "Pembedahan untuk memperbaiki jaringan gusi", price: 250000 },
    { name: "Tambal gigi kecil (klas I, V kecil, III kecil)", description: "Penambalan pada bagian kecil gigi", price: 300000 },
    { name: "Tambal gigi besar (klas II, III besar, IV, V besar)", description: "Penambalan pada bagian besar gigi", price: 400000 },
    { name: "Tambal estetik/direct veneer", description: "Penambalan untuk tujuan estetika", price: 600000 },
    { name: "Pencabutan gigi standar", description: "Cabut gigi biasa tanpa komplikasi", price: 250000 },
    { name: "Pencabutan gigi dengan penyulit", description: "Cabut gigi bungsu rahang atas/separasi", price: 400000 },
    { name: "Penjahitan setelah pencabutan", description: "Penjahitan setelah pencabutan dengan komplikasi", price: 200000 },
    { name: "Odontektomi", description: "Pencabutan gigi bungsu terpendam", price: 1800000 },
    { name: "Angkat jahitan", description: "Pengangkatan jahitan setelah operasi", price: 200000 },
    { name: "Gigi Tiruan Sebagian Lepasan bahan Akrilik (1 gigi pertama)", description: "Gigi tiruan lepasan bahan akrilik (1 gigi pertama)", price: 1000000 },
    { name: "Gigi Tiruan Sebagian Lepasan bahan Akrilik tambahan", description: "Tambahan gigi untuk GT lepasan bahan akrilik", price: 150000 },
    { name: "Gigi Tiruan Sebagian Lepasan bahan Valplas (1 gigi pertama)", description: "Gigi tiruan lepasan bahan valplas (1 gigi pertama)", price: 1350000 },
    { name: "Gigi Tiruan Sebagian Lepasan bahan Valplas tambahan", description: "Tambahan gigi untuk GT lepasan bahan valplas", price: 150000 },
    { name: "Gigi Tiruan Lengkap bahan Akrilik per 1 rahang", description: "Gigi tiruan lengkap bahan akrilik untuk satu rahang", price: 3000000 },
    { name: "Mock up 1 gigi", description: "Simulasi penambalan/penempelan sementara", price: 250000 },
    { name: "Mock up tambahan per 1 gigi selanjutnya", description: "Tambah mock up per gigi", price: 50000 },
    { name: "Mahkota sementara 1 gigi", description: "Mahkota sementara untuk melindungi gigi", price: 250000 },
    { name: "Mahkota sementara tambahan per 1 gigi selanjutnya", description: "Mahkota tambahan", price: 50000 },
    { name: "Crown PFM/bridge per gigi", description: "Mahkota permanen bahan PFM atau bridge", price: 2000000 },
    { name: "Crown Porcelain/bridge per gigi", description: "Mahkota permanen bahan porcelain", price: 3000000 },
    { name: "Perawatan Saluran Akar", description: "Perawatan saluran akar (root canal treatment)", price: 400000 },
    { name: "Rekapitulasi saluran akar", description: "Ulang perawatan saluran akar", price: 250000 },
    { name: "Pengisian saluran akar", description: "Pengisian ulang saluran akar", price: 300000 },
    { name: "Insersi pasak fiber dan pembentukan crown", description: "Pemasangan pasak fiber dan mahkota", price: 350000 },
    { name: "Rewalling", description: "Perbaikan dinding gigi", price: 250000 },
    { name: "Tumpat post PSA", description: "Tumpatan setelah perawatan saluran akar", price: 600000 },
    { name: "Relief of pain", description: "Pereda nyeri sesaat", price: 200000 },
    { name: "Cabut gigi anak dengan Clorethyl", description: "Pencabutan gigi susu menggunakan semprotan anestesi", price: 200000 },
    { name: "Splinting 3 gigi pertama", description: "Penguatan gigi goyang dengan splinting", price: 400000 },
    { name: "Splinting per 1 gigi selanjutnya", description: "Penambahan splinting per gigi", price: 100000 },
    { name: "Retainer plastik", description: "Alat retensi untuk menjaga posisi gigi", price: 500000 },
    { name: "Retainer akrilik", description: "Retainer bahan akrilik", price: 750000 },
    { name: "Reparasi GT akrilik", description: "Perbaikan gigi tiruan akrilik", price: 300000 },
    { name: "Rebasing GT akrilik", description: "Penggantian dasar GT akrilik", price: 400000 },
    { name: "Relining GT akrilik", description: "Pelapisan ulang GT akrilik", price: 350000 },
    { name: "Individual tray", description: "Tray individu untuk cetakan gigi", price: 250000 },
  ];

  let created = 0;
  for (const service of services) {
    const exists = await prisma.service.findFirst({ where: { name: service.name } });
    if (!exists) {
      await prisma.service.create({ data: service });
      created += 1;
    }
  }

  console.log(
    `${created} layanan baru ditambahkan (${services.length - created} sudah ada, dilewati).`
  );
}

module.exports = seedServices;
