/**
 * Litsenziya turlari va konfiguratsiya
 * O'zbekiston Murabbiylar ta'limi - 26 ta litsenziya turi
 */

export const LICENSE_COLORS = {
  D: '#9B59B6',           // Binafsha
  C: '#3498DB',           // Ko'k
  B: '#1ABC9C',           // Moviy-yashil
  A: '#E67E22',           // To'q sariq
  PRO: '#F39C12',         // Oltin
  GK_1: '#27AE60',        // To'q yashil
  GK_2: '#2ECC71',        // Yashil
  GK_3: '#16A085',        // Moviy-yashil
  FITNESS_1: '#E84393',   // Pushti
  FITNESS_2: '#C0392B',   // To'q pushti
  FITNESS_3: '#8E44AD',   // To'q binafsha
  SELEK: '#2980B9',       // Chuqur ko'k
  PSYCH: '#8E44AD',       // Binafsha
  ANALYTICS_1: '#17A589', // Feruza
  ANALYTICS_2: '#148F77', // To'q feruza
  C_RENEWAL: '#7F8C8D',   // Kulrang
  B_RENEWAL: '#7F8C8D',
  A_RENEWAL: '#7F8C8D',
  PRO_RENEWAL: '#7F8C8D',
  BEACH: '#F39C12',       // To'q sariq
  FUTSAL_1: '#D35400',    // To'q to'q sariq
  FUTSAL_2: '#A04000',    // Jigarrang-to'q
  FUTSAL_3: '#784212',    // Qo'ng'ir
  FUTSAL_GK_1: '#1F618D', // Chuqur ko'k
  FUTSAL_GK_2: '#154360', // To'q chuqur ko'k
  FUTSAL_GK_3: '#0B2545', // Eng to'q
};

export const LICENSE_REQUIREMENTS = {
  D: {
    prerequisite: null,
    waitingDays: 0,
    minAge: 18,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4'],
    name: "D Litsenziya",
    description: "Boshlang'ich murabbiy litsenziyasi",
  },
  C: {
    prerequisite: 'D',
    waitingDays: 183,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "C Litsenziya",
    description: "O'rta murabbiy litsenziyasi",
  },
  B: {
    prerequisite: 'C',
    waitingDays: 365,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "B Litsenziya",
    description: "Yuqori murabbiy litsenziyasi",
  },
  A: {
    prerequisite: 'B',
    waitingDays: 730,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "A Litsenziya",
    description: "Professional murabbiy litsenziyasi",
  },
  PRO: {
    prerequisite: 'A',
    waitingDays: 1095,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "PRO Litsenziya",
    description: "Eng yuqori professional litsenziya",
  },
  GK_1: {
    prerequisite: 'C',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Darvozabon 1-daraja",
    description: "Darvozabon murabbiyligi - 1-daraja",
  },
  GK_2: {
    prerequisite: 'GK_1',
    waitingDays: 365,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Darvozabon 2-daraja",
    description: "Darvozabon murabbiyligi - 2-daraja",
  },
  GK_3: {
    prerequisite: 'GK_2',
    waitingDays: 730,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Darvozabon 3-daraja",
    description: "Darvozabon murabbiyligi - 3-daraja",
  },
  FITNESS_1: {
    prerequisite: 'B',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Fitness 1-daraja",
    description: "Fitness murabbiyligi - 1-daraja",
  },
  FITNESS_2: {
    prerequisite: 'FITNESS_1',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Fitness 2-daraja",
    description: "Fitness murabbiyligi - 2-daraja",
  },
  FITNESS_3: {
    prerequisite: 'FITNESS_2',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Fitness 3-daraja",
    description: "Fitness murabbiyligi - 3-daraja",
  },
  SELEK: {
    prerequisite: 'C',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Seleksiyoner",
    description: "Futbolchilar seleksiyonchisi",
  },
  PSYCH: {
    prerequisite: 'C',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Psixolog",
    description: "Sport psixologi",
  },
  ANALYTICS_1: {
    prerequisite: 'C',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Analitik 1-daraja",
    description: "Futbol analitigi - 1-daraja",
  },
  ANALYTICS_2: {
    prerequisite: 'ANALYTICS_1',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Analitik 2-daraja",
    description: "Futbol analitigi - 2-daraja",
  },
  C_RENEWAL: {
    prerequisite: 'C',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    needsValidityDates: true,
    name: "C Litsenziya yangilash",
    description: "C litsenziyasini yangilash",
  },
  B_RENEWAL: {
    prerequisite: 'B',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    needsValidityDates: true,
    name: "B Litsenziya yangilash",
    description: "B litsenziyasini yangilash",
  },
  A_RENEWAL: {
    prerequisite: 'A',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    needsValidityDates: true,
    name: "A Litsenziya yangilash",
    description: "A litsenziyasini yangilash",
  },
  PRO_RENEWAL: {
    prerequisite: 'PRO',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: true,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    needsValidityDates: true,
    name: "PRO Litsenziya yangilash",
    description: "PRO litsenziyasini yangilash",
  },
  BEACH: {
    prerequisite: null,
    waitingDays: 0,
    minAge: 18,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4'],
    name: "Beach Soccer",
    description: "Beach futbol murabbiyligi",
  },
  FUTSAL_1: {
    prerequisite: null,
    waitingDays: 0,
    minAge: 18,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4'],
    name: "Futsal 1-daraja",
    description: "Futsal murabbiyligi - 1-daraja",
  },
  FUTSAL_2: {
    prerequisite: 'FUTSAL_1',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Futsal 2-daraja",
    description: "Futsal murabbiyligi - 2-daraja",
  },
  FUTSAL_3: {
    prerequisite: 'FUTSAL_2',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Futsal 3-daraja",
    description: "Futsal murabbiyligi - 3-daraja",
  },
  FUTSAL_GK_1: {
    prerequisite: 'FUTSAL_1',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Futsal Darvozabon 1",
    description: "Futsal darvozabon murabbiyligi - 1-daraja",
  },
  FUTSAL_GK_2: {
    prerequisite: 'FUTSAL_GK_1',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Futsal Darvozabon 2",
    description: "Futsal darvozabon murabbiyligi - 2-daraja",
  },
  FUTSAL_GK_3: {
    prerequisite: 'FUTSAL_GK_2',
    waitingDays: 0,
    minAge: 0,
    tashkentOnly: false,
    requiredDocs: ['passport', 'photo_3x4', 'prev_license'],
    name: "Futsal Darvozabon 3",
    description: "Futsal darvozabon murabbiyligi - 3-daraja",
  },
};

export const LICENSE_CATEGORIES = [
  { key: 'main', label: 'Asosiy', color: '#3498DB' },
  { key: 'gk', label: 'Darvozabon', color: '#27AE60' },
  { key: 'fitness', label: 'Fitness', color: '#E84393' },
  { key: 'specialist', label: 'Mutaxassislik', color: '#2980B9' },
  { key: 'renewal', label: 'Yangilash', color: '#7F8C8D' },
  { key: 'special', label: 'Maxsus', color: '#F39C12' },
];

export const APPLICATION_STATUS = {
  pending: { label: 'Kutilmoqda', color: '#F39C12', icon: 'Clock' },
  under_review: { label: "Ko'rib chiqilmoqda", color: '#3498DB', icon: 'Eye' },
  additional_docs: { label: "Qo\'shimcha hujjatlar kerak", color: '#E67E22', icon: 'FileWarning' },
  approved: { label: 'Tasdiqlangan', color: '#27AE60', icon: 'CheckCircle' },
  rejected: { label: "Rad etilgan", color: '#E74C3C', icon: 'XCircle' },
};
