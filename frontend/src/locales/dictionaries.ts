export type Language = "uz" | "ru" | "en";

export interface Dictionary {
  appName: string;
  internalPortal: string;
  dashboard: string;
  newBooking: string;
  activeBorrowings: string;
  booksInventory: string;
  students: string;
  staff: string;
  adminManagement: string;
  logout: string;
  collapse: string;
  expand: string;

  loginTitle: string;
  loginSubtitle: string;
  usernameLabel: string;
  passwordLabel: string;
  usernamePlaceholder: string;
  passwordPlaceholder: string;
  loginButton: string;
  authenticating: string;
  loginProtectedNote: string;
  invalidCredentials: string;

  statusActive: string;
  statusReturned: string;
  statusOverdue: string;
  goodStanding: string;
  overdueDebtor: string;
  available: string;
  outOfStock: string;
  archived: string;

  searchPlaceholder: string;
  allCategories: string;
  previous: string;
  next: string;
  pageOf: string;
  showingResults: string;
  actions: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  returnAction: string;
  confirmReturnPrompt: string;
  debtorsOnly: string;
  mostActive: string;
  clickToCopy: string;

  operationsDashboard: string;
  dashboardSubtitle: string;
  refreshData: string;
  issueNewBook: string;
  totalBooks: string;
  copiesAcrossShelves: string;
  availableInLibrary: string;
  readyForCheckout: string;
  activeBorrowed: string;
  inCirculation: string;
  overdueIssues: string;
  past14Days: string;
  categoryDistribution: string;
  categoryDistSubtitle: string;
  availableUnits: string;
  borrowedUnits: string;
  enrolledStudents: string;
  registeredStaff: string;
  viewStudentDirectory: string;
  viewStaffDirectory: string;

  issueBookTitle: string;
  issueBookSubtitle: string;
  borrowerSelection: string;
  student: string;
  staffMember: string;
  change: string;
  searchBorrowerPlaceholder: string;
  categoryAndBook: string;
  categoryFilter: string;
  bookTitleSearch: string;
  bookSearchPlaceholder: string;
  readyToIssue: string;
  loanTerms: string;
  issueDateToday: string;
  mandatoryDueDate: string;
  confirmIssueButton: string;
  issuingBook: string;

  bookCatalogTitle: string;
  bookCatalogSubtitle: string;
  importExcel: string;
  addCategory: string;
  addBook: string;
  totalStock: string;
  loanedOut: string;
  editBook: string;
  deleteBook: string;
  confirmDeleteBook: string;
  currentlyLoaned: string;
  minStockRequired: string;
  bookUpdatedSuccess: string;
  bookDeletedSuccess: string;
  bookTitlePlaceholder: string;
  totalQtyLabel: string;

  studentsTitle: string;
  studentsSubtitle: string;
  enrollStudent: string;
  importExcelStudents: string;
  staffTitle: string;
  staffSubtitle: string;
  registerStaff: string;
  group: string;
  major: string;
  department: string;
  phone: string;
  activeLoans: string;
  totalBorrows: string;
  editStudent: string;
  deleteStudent: string;
  confirmDeleteStudent: string;
  deleteErrorHasLoans: string;
  studentUpdatedSuccess: string;
  studentDeletedSuccess: string;

  educationType: string;
  educationForm: string;
  specialty: string;
  course: string;
  studyGroup: string;
  birthDate: string;
  fullName: string;
  phoneOptional: string;
  phoneNotEntered: string;
  addNew: string;
  searchOrAdd: string;
  selectEducationType: string;
  selectEducationForm: string;
  selectSpecialty: string;
  selectCourse: string;
  selectStudyGroup: string;
  excelStudentsRequiredCols: string;
  statsProcessed: string;
  statsAdded: string;
  statsUpdated: string;
  statsFailed: string;
  studentPhoneMissingNotice: string;
  enterStudentPhonePrompt: string;
  phonePlaceholder: string;

  borrowingsTitle: string;
  borrowingsSubtitle: string;
  filterOpen: string;
  filterOverdue: string;
  filterReturned: string;
  loanId: string;
  bookTitle: string;
  borrower: string;
  issueDate: string;
  dueDate: string;
  status: string;

  adminsTitle: string;
  adminsSubtitle: string;
  createOperator: string;
  accessRestricted: string;
  editAdmin: string;
  changePassword: string;
  newPasswordLabel: string;
  deleteAdmin: string;
  confirmDeleteAdmin: string;
  adminUpdatedSuccess: string;
  passwordUpdatedSuccess: string;
  adminDeletedSuccess: string;
  actionsLabel: string;
  roleLabel: string;
  createdAtLabel: string;
  accessLevelLabel: string;
  fullControl: string;
  borrowAndReturn: string;
  roleAdminLabel: string;
  roleLibrarianLabel: string;
  passwordMinLengthHint: string;
  cannotDeleteSelf: string;

  selectedBooksCart: string;
  selectedBooksCount: string;
  maxBooksLimitNotice: string;
  bookAlreadyInCart: string;
  cartEmptyNotice: string;
  studentPhoneMissingHighlight: string;
  phoneSaveNote: string;
  automaticReturnDate: string;
  daysOverdueCount: string;
  tabAll: string;
  tabActive: string;
  tabOverdue: string;
  tabReturned7d: string;
  tabFullHistory: string;
  filterOverdueOnly: string;
  searchBorrowingsPlaceholder: string;
  confirmReturnTitle: string;
  confirmReturnMessage: string;
  returnSuccess: string;
  searchStudentPlaceholder: string;
  selectedStudent: string;
  removeBook: string;
  issueBooksSuccess: string;
  batchIssuingBooks: string;
  batchIssueButton: string;
}

export const dictionaries: Record<Language, Dictionary> = {
  uz: {
    appName: "Kutubxona",
    internalPortal: "Boshqaruv tizimi",
    dashboard: "Bosh sahifa",
    newBooking: "Kitob berish",
    activeBorrowings: "Ijaralar & Qaytarish",
    booksInventory: "Kitoblar fondi",
    students: "Talabalar",
    staff: "Xodimlar",
    adminManagement: "Adminlar",
    logout: "Chiqish",
    collapse: "Yig'ish",
    expand: "Kengaytirish",

    loginTitle: "Kutubxona Boshqaruv Tizimi",
    loginSubtitle: "Faqat vakolatli xodimlar uchun yopiq portal",
    usernameLabel: "Foydalanuvchi nomi",
    passwordLabel: "Parol",
    usernamePlaceholder: "Foydalanuvchi nomini kiriting",
    passwordPlaceholder: "Parolni kiriting",
    loginButton: "Tizimga kirish",
    authenticating: "Tekshirilmoqda...",
    loginProtectedNote: "Yopiq ichki tizim. Kirish uchun IT adminga murojaat qiling.",
    invalidCredentials: "Noto'g'ri login yoki parol kiritildi.",

    statusActive: "Band qilingan",
    statusReturned: "Topshirildi",
    statusOverdue: "Muddati o'tgan",
    goodStanding: "Qarzdor emas",
    overdueDebtor: "Qarzdor",
    available: "Mavjud",
    outOfStock: "Mavjud emas",
    archived: "Arxivlangan",

    searchPlaceholder: "Qidiruv...",
    allCategories: "Barcha toifalar",
    previous: "Oldingi",
    next: "Keyingi",
    pageOf: "Sahifa",
    showingResults: "Ko'rsatilmoqda",
    actions: "Harakatlar",
    cancel: "Bekor qilish",
    save: "Saqlash",
    edit: "Tahrirlash",
    delete: "O'chirish",
    returnAction: "Qaytarish",
    confirmReturnPrompt: "Kitobni qaytarishni tasdiqlaysizmi? Fond +1 ga oshiriladi.",
    debtorsOnly: "Faqat qarzdorlar",
    mostActive: "Eng faollar",
    clickToCopy: "Nusxa olish uchun bosing",

    operationsDashboard: "Operatsion boshqaruv paneli",
    dashboardSubtitle: "Haqiqiy vaqtdagi ko'rsatkichlar, kitoblar fondi va ijara holati",
    refreshData: "Yangilash",
    issueNewBook: "Yangi kitob berish",
    totalBooks: "Jami kitoblar",
    copiesAcrossShelves: "kutubxona fondidagi barcha nusxalar",
    availableInLibrary: "Mavjud kitoblar",
    readyForCheckout: "foydalanishga tayyor",
    activeBorrowed: "Berilgan kitoblar",
    inCirculation: "kitobxonlar qo'lida",
    overdueIssues: "Muddati o'tganlar",
    past14Days: "14 kundan oshgan",
    categoryDistribution: "Toifalar bo'yicha taqsimot",
    categoryDistSubtitle: "Umumiy fond, mavjud nusxalar va berilgan kitoblar nisbati",
    availableUnits: "mavjud",
    borrowedUnits: "berilgan",
    enrolledStudents: "Ro'yxatdagi talabalar",
    registeredStaff: "Ro'yxatdagi xodimlar",
    viewStudentDirectory: "Talabalar ro'yxatiga o'tish →",
    viewStaffDirectory: "Xodimlar ro'yxatiga o'tish →",

    issueBookTitle: "Kitob berish (Yangi ijara)",
    issueBookSubtitle: "Kitobni talaba yoki xodimga biriktirish. 14 kunlik muddat avtomatik belgilanadi.",
    borrowerSelection: "Kitobxonni tanlash",
    student: "Talaba",
    staffMember: "Xodim",
    change: "O'zgartirish",
    searchBorrowerPlaceholder: "F.I.Sh yoki guruh bo'yicha qidirish...",
    categoryAndBook: "Kategoriya va kitob tanlash",
    categoryFilter: "Toifa bo'yicha saralash (ixtiyoriy)",
    bookTitleSearch: "Kitob nomi (300ms qidiruv)",
    bookSearchPlaceholder: "Kitob nomini kiriting...",
    readyToIssue: "BERISHGA TAYYOR",
    loanTerms: "Ijara shartlari (14 kun)",
    issueDateToday: "Berilgan sana (Bugun)",
    mandatoryDueDate: "Qaytarish muddati (+14 kun)",
    confirmIssueButton: "Tasdiqlash va berish",
    issuingBook: "Rasmiylashtirilmoqda...",

    bookCatalogTitle: "Kitoblar fondi katalogi",
    bookCatalogSubtitle: "Kutubxonadagi jismoniy kitoblar, zaxira va nusxalar nazorati.",
    importExcel: "Excel (.xlsx) import",
    addCategory: "+ Toifa qo'shish",
    addBook: "Kitob qo'shish",
    totalStock: "Jami",
    loanedOut: "Berilgan",
    editBook: "Kitobni tahrirlash",
    deleteBook: "Kitobni o'chirish",
    confirmDeleteBook: "Haqiqatan ham ushbu kitobni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
    currentlyLoaned: "Hozirda berilgan",
    minStockRequired: "Jami nusxalar berilgan kitoblar sonidan kam bo'lishi mumkin emas",
    bookUpdatedSuccess: "Kitob ma'lumotlari yangilandi",
    bookDeletedSuccess: "Kitob o'chirildi",
    bookTitlePlaceholder: "Kitob nomi",
    totalQtyLabel: "Jami nusxalar soni",

    studentsTitle: "Talabalar ro'yxati",
    studentsSubtitle: "Ro'yxatdan o'tgan talabalar, ularning ijara tarixi va qarzdorlik holati.",
    enrollStudent: "Talaba qo'shish",
    importExcelStudents: "Excel orqali yuklash",
    staffTitle: "Universitet xodimlari",
    staffSubtitle: "Ro'yxatdan o'tgan professor-o'qituvchilar va xodimlar ro'yxati.",
    registerStaff: "Xodim qo'shish",
    group: "Guruh",
    major: "Yo'nalish",
    department: "Kafedra / Bo'lim",
    phone: "Telefon",
    activeLoans: "Qo'lidagi kitoblar",
    totalBorrows: "Jami olingan",
    editStudent: "Talabani tahrirlash",
    deleteStudent: "Talabani o'chirish",
    confirmDeleteStudent: "Haqiqatan ham ushbu talabani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
    deleteErrorHasLoans: "Qaytarilmagan kitoblari mavjud bo'lgani sababli o'chirib bo'lmaydi",
    studentUpdatedSuccess: "Talaba ma'lumotlari yangilandi",
    studentDeletedSuccess: "Talaba o'chirildi",

    educationType: "Ta'lim turi",
    educationForm: "Ta'lim shakli",
    specialty: "Yo'nalish (Mutaxassislik)",
    course: "Bosqich (Kurs)",
    studyGroup: "Guruh",
    birthDate: "Tug'ilgan sana",
    fullName: "F.I.Sh",
    phoneOptional: "Telefon raqami (ixtiyoriy)",
    phoneNotEntered: "Kiritilmagan",
    addNew: "+ Yangi qo'shish",
    searchOrAdd: "Qidiring yoki yangi nom kiriting...",
    selectEducationType: "Ta'lim turini tanlang",
    selectEducationForm: "Ta'lim shaklini tanlang",
    selectSpecialty: "Yo'nalishni tanlang",
    selectCourse: "Kursni tanlang",
    selectStudyGroup: "Guruhni tanlang",
    excelStudentsRequiredCols: "Excel fayl quyidagi ustunlarga ega bo'lishi shart:",
    statsProcessed: "Qayta ishlandi",
    statsAdded: "Qo'shildi",
    statsUpdated: "Yangilandi",
    statsFailed: "Xatolar",
    studentPhoneMissingNotice: "Talabaning telefon raqami kiritilmagan.",
    enterStudentPhonePrompt: "Iltimos, telefon raqamini kiriting:",
    phonePlaceholder: "+998 90 123 45 67",

    borrowingsTitle: "Kitoblar ijarasi & Qaytarish jurnali",
    borrowingsSubtitle: "14 kunlik ijaralar, muddati o'tgan qarzdorlar va topshirilgan kitoblar arxivi.",
    filterOpen: "Faol + Muddati o'tganlar",
    filterOverdue: "Faqat muddati o'tganlar",
    filterReturned: "Arxiv (Topshirilganlar)",
    loanId: "ID",
    bookTitle: "Kitob nomi",
    borrower: "Kitobxon",
    issueDate: "Berilgan sana",
    dueDate: "Qaytarish muddati",
    status: "Holat",

    adminsTitle: "Operatorlar boshqaruvi",
    adminsSubtitle: "Kutubxona tizimiga kirish huquqiga ega akkauntlar nazorati.",
    createOperator: "Operator qo'shish",
    accessRestricted: "Ruxsat cheklangan. Bosh Administrator huquqi talab qilinadi.",
    editAdmin: "Operatorni tahrirlash",
    changePassword: "Parolni o'zgartirish",
    newPasswordLabel: "Yangi parol",
    deleteAdmin: "Operatorni o'chirish",
    confirmDeleteAdmin: "Haqiqatan ham ushbu operatorni o'chirmoqchimisiz?",
    adminUpdatedSuccess: "Operator ma'lumotlari yangilandi",
    passwordUpdatedSuccess: "Parol muvaffaqiyatli yangilandi",
    adminDeletedSuccess: "Operator o'chirildi",
    actionsLabel: "Amallar",
    roleLabel: "Rol",
    createdAtLabel: "Yaratilgan sana",
    accessLevelLabel: "Darajasi",
    fullControl: "To'liq boshqaruv",
    borrowAndReturn: "Kitob berish & qaytarish",
    roleAdminLabel: "Admin (To'liq huquq)",
    roleLibrarianLabel: "Kutubxonachi (Ijara va qaytarish)",
    passwordMinLengthHint: "Kamida 6 ta belgi",
    cannotDeleteSelf: "O'z akkauntingizni o'chira olmaysiz",

    selectedBooksCart: "Tanlangan kitoblar savatchasi",
    selectedBooksCount: "Tanlangan kitoblar",
    maxBooksLimitNotice: "Maksimal 5 tagacha kitob tanlash mumkin",
    bookAlreadyInCart: "Bu kitob allaqachon savatchaga qo'shilgan",
    cartEmptyNotice: "Iltimos, kamida bitta kitob tanlang",
    studentPhoneMissingHighlight: "Talabaning telefon raqami kiritilmagan — saqlash uchun kiriting",
    phoneSaveNote: "Kitob berilganda kiritilgan telefon raqami talaba profiliga saqlanadi",
    automaticReturnDate: "Topshirish muddati (14 kun)",
    daysOverdueCount: "+{days} kun",
    tabAll: "Barchasi",
    tabActive: "Faol",
    tabOverdue: "Muddati o'tgan",
    tabReturned7d: "Topshirilgan (7 kunlik arxiv)",
    tabFullHistory: "To'liq arxiv",
    filterOverdueOnly: "Faqat muddati o'tganlar",
    searchBorrowingsPlaceholder: "Talaba, xodim yoki kitob nomi bo'yicha qidiruv...",
    confirmReturnTitle: "Kitobni qabul qilish",
    confirmReturnMessage: "Haqiqatan ham ushbu kitobni qabul qilib, zaxiraga qaytarmoqchimisiz?",
    returnSuccess: "Kitob muvaffaqiyatli qabul qilindi (+1 zaxira tiklandi)",
    searchStudentPlaceholder: "Talaba F.I.Sh, guruhi yoki telefonini kiriting...",
    selectedStudent: "Tanlangan talaba",
    removeBook: "O'chirish",
    issueBooksSuccess: "Kitoblar muvaffaqiyatli berildi!",
    batchIssuingBooks: "Kitoblar rasmiylashtirilmoqda...",
    batchIssueButton: "Kitoblarni berish",
  },
  ru: {
    appName: "Библиотека",
    internalPortal: "Система управления",
    dashboard: "Дашборд",
    newBooking: "Выдать книгу",
    activeBorrowings: "Выдачи & Возвраты",
    booksInventory: "Фонд книг",
    students: "Студенты",
    staff: "Сотрудники",
    adminManagement: "Администраторы",
    logout: "Выйти",
    collapse: "Свернуть",
    expand: "Развернуть",

    loginTitle: "Система управления библиотекой",
    loginSubtitle: "Закрытый портал для авторизованного персонала",
    usernameLabel: "Имя пользователя",
    passwordLabel: "Пароль",
    usernamePlaceholder: "Введите имя пользователя",
    passwordPlaceholder: "Введите пароль",
    loginButton: "Войти в систему",
    authenticating: "Авторизация...",
    loginProtectedNote: "Закрытая внутренняя система. Для доступа обратитесь к IT-администратору.",
    invalidCredentials: "Неверное имя пользователя или пароль.",

    statusActive: "Активна",
    statusReturned: "Возвращена",
    statusOverdue: "Просрочена",
    goodStanding: "Без задолженностей",
    overdueDebtor: "Должник",
    available: "В наличии",
    outOfStock: "Нет в наличии",
    archived: "В архиве",

    searchPlaceholder: "Поиск...",
    allCategories: "Все категории",
    previous: "Назад",
    next: "Вперед",
    pageOf: "Страница",
    showingResults: "Показано",
    actions: "Действия",
    cancel: "Отмена",
    save: "Сохранить",
    edit: "Редактировать",
    delete: "Удалить",
    returnAction: "Принять возврат",
    confirmReturnPrompt: "Подтвердить возврат книги? Фонд книги будет увеличен на +1.",
    debtorsOnly: "Только должники",
    mostActive: "Самые активные",
    clickToCopy: "Нажмите, чтобы скопировать",

    operationsDashboard: "Операционный дашборд",
    dashboardSubtitle: "Показатели библиотеки в реальном времени, категории и статус выдачи",
    refreshData: "Обновить",
    issueNewBook: "Выдать книгу",
    totalBooks: "Всего книг",
    copiesAcrossShelves: "экземпляров во всем фонде",
    availableInLibrary: "В наличии",
    readyForCheckout: "готово к выдаче читателям",
    activeBorrowed: "На руках",
    inCirculation: "находится у читателей",
    overdueIssues: "Просрочено",
    past14Days: "более 14 дней займа",
    categoryDistribution: "Распределение по категориям",
    categoryDistSubtitle: "Общий баланс фонда, доступные на полках и выданные экземпляры",
    availableUnits: "доступно",
    borrowedUnits: "выдано",
    enrolledStudents: "Студентов в базе",
    registeredStaff: "Сотрудников в базе",
    viewStudentDirectory: "Справочник студентов →",
    viewStaffDirectory: "Справочник сотрудников →",

    issueBookTitle: "Выдача книги (Новый заем)",
    issueBookSubtitle: "Привязка книги к студенту или сотруднику. Срок 14 дней рассчитывается автоматически.",
    borrowerSelection: "Выбор читателя",
    student: "Студент",
    staffMember: "Сотрудник",
    change: "Изменить",
    searchBorrowerPlaceholder: "Поиск по имени или группе...",
    categoryAndBook: "Категория и выбор книги",
    categoryFilter: "Фильтр по категории (опционально)",
    bookTitleSearch: "Название книги (поиск с задержкой 300мс)",
    bookSearchPlaceholder: "Введите название книги...",
    readyToIssue: "ГОТОВО К ВЫДАЧЕ",
    loanTerms: "Условия выдачи (14 дней)",
    issueDateToday: "Дата выдачи (Сегодня)",
    mandatoryDueDate: "Срок возврата (+14 дней)",
    confirmIssueButton: "Подтвердить и выдать",
    issuingBook: "Оформление...",

    bookCatalogTitle: "Каталог библиотечного фонда",
    bookCatalogSubtitle: "Управление физическими экземплярами и остатком на полках.",
    importExcel: "Импорт из Excel (.xlsx)",
    addCategory: "+ Категория",
    addBook: "Добавить книгу",
    totalStock: "Всего",
    loanedOut: "Выдано",
    editBook: "Редактировать книгу",
    deleteBook: "Удалить книгу",
    confirmDeleteBook: "Вы уверены, что хотите удалить эту книгу? Это действие необратимо.",
    currentlyLoaned: "Сейчас на руках",
    minStockRequired: "Общее количество не может быть меньше выданных книг",
    bookUpdatedSuccess: "Данные книги обновлены",
    bookDeletedSuccess: "Книга удалена",
    bookTitlePlaceholder: "Название книги",
    totalQtyLabel: "Общее количество экземпляров",

    studentsTitle: "Справочник студентов",
    studentsSubtitle: "Зарегистрированные читатели, история выдачи и задолженностей.",
    enrollStudent: "Добавить студента",
    importExcelStudents: "Импорт из Excel",
    staffTitle: "Справочник сотрудников",
    staffSubtitle: "Преподаватели и сотрудники университета.",
    registerStaff: "Добавить сотрудника",
    group: "Группа",
    major: "Специальность",
    department: "Кафедра / Отдел",
    phone: "Телефон",
    activeLoans: "На руках",
    totalBorrows: "Всего займов",
    editStudent: "Редактировать студента",
    deleteStudent: "Удалить студента",
    confirmDeleteStudent: "Вы уверены, что хотите удалить этого студента? Это действие необратимо.",
    deleteErrorHasLoans: "Невозможно удалить: имеются невозвращенные книги",
    studentUpdatedSuccess: "Данные студента обновлены",
    studentDeletedSuccess: "Студент удален",

    educationType: "Тип обучения",
    educationForm: "Форма обучения",
    specialty: "Специальность",
    course: "Курс студента",
    studyGroup: "Группа",
    birthDate: "Дата рождения",
    fullName: "Ф.И.О. студента",
    phoneOptional: "Номер телефона (необязательно)",
    phoneNotEntered: "Не указан",
    addNew: "+ Добавить новый",
    searchOrAdd: "Поиск или введите новое значение...",
    selectEducationType: "Выберите тип обучения",
    selectEducationForm: "Выберите форму обучения",
    selectSpecialty: "Выберите специальность",
    selectCourse: "Выберите курс",
    selectStudyGroup: "Выберите группу",
    excelStudentsRequiredCols: "Файл Excel должен содержать следующие колонки:",
    statsProcessed: "Обработано",
    statsAdded: "Добавлено",
    statsUpdated: "Обновлено",
    statsFailed: "Ошибки",
    studentPhoneMissingNotice: "Номер телефона студента не указан.",
    enterStudentPhonePrompt: "Пожалуйста, введите номер телефона:",
    phonePlaceholder: "+998 90 123 45 67",

    borrowingsTitle: "Журнал выдачи и возвратов",
    borrowingsSubtitle: "Активные займы на 14 дней, просроченные задолженности и архив.",
    filterOpen: "Активные + Просроченные",
    filterOverdue: "Только просроченные",
    filterReturned: "Архив (Возвращенные)",
    loanId: "ID",
    bookTitle: "Название книги",
    borrower: "Читатель",
    issueDate: "Выдана",
    dueDate: "Срок сдачи",
    status: "Статус",

    adminsTitle: "Управление операторами",
    adminsSubtitle: "Управление аккаунтами с доступом к системе.",
    createOperator: "Создать оператора",
    accessRestricted: "Доступ ограничен. Требуются права Главного Администратора.",
    editAdmin: "Редактировать оператора",
    changePassword: "Сменить пароль",
    newPasswordLabel: "Новый пароль",
    deleteAdmin: "Удалить оператора",
    confirmDeleteAdmin: "Вы уверены, что хотите удалить этого оператора?",
    adminUpdatedSuccess: "Данные оператора обновлены",
    passwordUpdatedSuccess: "Пароль успешно обновлен",
    adminDeletedSuccess: "Оператор удален",
    actionsLabel: "Действия",
    roleLabel: "Роль",
    createdAtLabel: "Дата создания",
    accessLevelLabel: "Уровень доступа",
    fullControl: "Полный контроль",
    borrowAndReturn: "Выдача и возврат книг",
    roleAdminLabel: "Админ (Полные права)",
    roleLibrarianLabel: "Библиотекарь (Выдача и возврат)",
    passwordMinLengthHint: "Минимум 6 символов",
    cannotDeleteSelf: "Нельзя удалить собственный аккаунт",

    selectedBooksCart: "Корзина выбранных книг",
    selectedBooksCount: "Выбранные книги",
    maxBooksLimitNotice: "Можно выбрать максимум 5 книг",
    bookAlreadyInCart: "Эта книга уже добавлена в корзину",
    cartEmptyNotice: "Пожалуйста, выберите хотя бы одну книгу",
    studentPhoneMissingHighlight: "Номер телефона студента не указан — введите для сохранения",
    phoneSaveNote: "При выдаче книги введенный номер сохранится в профиле студента",
    automaticReturnDate: "Срок возврата (14 дней)",
    daysOverdueCount: "+{days} дн.",
    tabAll: "Все",
    tabActive: "Активные",
    tabOverdue: "Просроченные",
    tabReturned7d: "Возвращенные (7-дневный архив)",
    tabFullHistory: "Полный архив",
    filterOverdueOnly: "Только просроченные",
    searchBorrowingsPlaceholder: "Поиск по студенту, сотруднику или книге...",
    confirmReturnTitle: "Прием книги",
    confirmReturnMessage: "Вы действительно хотите отметить эту книгу как возвращенную?",
    returnSuccess: "Книга успешно принята (+1 экземпляр восстановлен)",
    searchStudentPlaceholder: "Введите Ф.И.О., группу или телефон студента...",
    selectedStudent: "Выбранный студент",
    removeBook: "Удалить",
    issueBooksSuccess: "Книги успешно выданы!",
    batchIssuingBooks: "Оформление выдачи...",
    batchIssueButton: "Выдать книги",
  },
  en: {
    appName: "Library Ops",
    internalPortal: "Management Portal",
    dashboard: "Dashboard",
    newBooking: "Issue Book",
    activeBorrowings: "Loans & Returns",
    booksInventory: "Books Inventory",
    students: "Students",
    staff: "Staff",
    adminManagement: "Admins",
    logout: "Sign Out",
    collapse: "Collapse",
    expand: "Expand",

    loginTitle: "Library Management System",
    loginSubtitle: "Authorized Personnel Access Only",
    usernameLabel: "Username",
    passwordLabel: "Password",
    usernamePlaceholder: "Enter your username",
    passwordPlaceholder: "Enter your password",
    loginButton: "Sign In to Portal",
    authenticating: "Authenticating...",
    loginProtectedNote: "Protected internal system. For credentials, contact IT Admin.",
    invalidCredentials: "Invalid credentials. Please verify your username and password.",

    statusActive: "Active",
    statusReturned: "Returned",
    statusOverdue: "Overdue",
    goodStanding: "Good Standing",
    overdueDebtor: "Overdue Debtor",
    available: "Available",
    outOfStock: "Out of Stock",
    archived: "Archived",

    searchPlaceholder: "Search...",
    allCategories: "All Categories",
    previous: "Previous",
    next: "Next",
    pageOf: "Page",
    showingResults: "Showing",
    actions: "Actions",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    returnAction: "Return",
    confirmReturnPrompt: "Confirm return? Available inventory will be incremented by +1.",
    debtorsOnly: "Debtors Only",
    mostActive: "Most Active",
    clickToCopy: "Click to copy phone number",

    operationsDashboard: "Operations Dashboard",
    dashboardSubtitle: "Real-time library metrics, category inventories, and borrowing status",
    refreshData: "Refresh Data",
    issueNewBook: "Issue Book",
    totalBooks: "Total Books",
    copiesAcrossShelves: "copies across all shelves",
    availableInLibrary: "Available in Library",
    readyForCheckout: "ready for checkout",
    activeBorrowed: "Active Borrowed",
    inCirculation: "currently in circulation",
    overdueIssues: "Overdue Issues",
    past14Days: "past 14 days due",
    categoryDistribution: "Category Inventory Distribution",
    categoryDistSubtitle: "Breakdown of total inventory, in-shelf availability, and active borrower loans",
    availableUnits: "available",
    borrowedUnits: "borrowed",
    enrolledStudents: "Enrolled Students",
    registeredStaff: "Registered Staff",
    viewStudentDirectory: "View student directory →",
    viewStaffDirectory: "View staff directory →",

    issueBookTitle: "Issue Book (New Booking)",
    issueBookSubtitle: "Assign book copy to student or staff. Auto-configures 14-day loan lifecycle.",
    borrowerSelection: "Borrower Selection",
    student: "Student",
    staffMember: "Staff Member",
    change: "Change",
    searchBorrowerPlaceholder: "Search by name or group/dept...",
    categoryAndBook: "Category & Book Selection",
    categoryFilter: "Category Filter (Optional)",
    bookTitleSearch: "Book Title (300ms Fuzzy Search)",
    bookSearchPlaceholder: "Type book title to search...",
    readyToIssue: "READY TO ISSUE",
    loanTerms: "Loan Terms (Fixed 14 Days)",
    issueDateToday: "Issue Date (Today)",
    mandatoryDueDate: "Mandatory Due Date (+14d)",
    confirmIssueButton: "Confirm & Issue Book",
    issuingBook: "Issuing Book...",

    bookCatalogTitle: "Book Inventory Catalog",
    bookCatalogSubtitle: "Manage physical copies, total quantities, and available shelf stock.",
    importExcel: "Import .xlsx",
    addCategory: "+ Category",
    addBook: "Add Book",
    totalStock: "Total Stock",
    loanedOut: "Loaned Out",
    editBook: "Edit Book",
    deleteBook: "Delete Book",
    confirmDeleteBook: "Are you sure you want to delete this book? This action cannot be undone.",
    currentlyLoaned: "Currently loaned",
    minStockRequired: "Total quantity cannot be less than currently loaned books",
    bookUpdatedSuccess: "Book updated successfully",
    bookDeletedSuccess: "Book deleted successfully",
    bookTitlePlaceholder: "Book title",
    totalQtyLabel: "Total quantity",

    studentsTitle: "Students Directory",
    studentsSubtitle: "Registered student borrowers, active borrowings, and debt tracking.",
    enrollStudent: "Enroll Student",
    importExcelStudents: "Import from Excel",
    staffTitle: "University Staff Directory",
    staffSubtitle: "Registered faculty and staff borrowers, departments, and active loans.",
    registerStaff: "Register Staff",
    group: "Group",
    major: "Major",
    department: "Department",
    phone: "Phone",
    activeLoans: "Active Loans",
    totalBorrows: "Total Borrows",
    editStudent: "Edit Student",
    deleteStudent: "Delete Student",
    confirmDeleteStudent: "Are you sure you want to delete this student? This action cannot be undone.",
    deleteErrorHasLoans: "Cannot delete: has unreturned books",
    studentUpdatedSuccess: "Student updated successfully",
    studentDeletedSuccess: "Student deleted successfully",

    educationType: "Education Type",
    educationForm: "Education Form",
    specialty: "Specialty",
    course: "Student Course",
    studyGroup: "Group",
    birthDate: "Birth Date",
    fullName: "Full Name",
    phoneOptional: "Phone Number (optional)",
    phoneNotEntered: "Not set",
    addNew: "+ Add new",
    searchOrAdd: "Search or type new...",
    selectEducationType: "Select education type",
    selectEducationForm: "Select education form",
    selectSpecialty: "Select specialty",
    selectCourse: "Select course",
    selectStudyGroup: "Select group",
    excelStudentsRequiredCols: "The Excel file must contain the following columns:",
    statsProcessed: "Processed",
    statsAdded: "Added",
    statsUpdated: "Updated",
    statsFailed: "Failed",
    studentPhoneMissingNotice: "Student phone number is not specified.",
    enterStudentPhonePrompt: "Please enter phone number:",
    phonePlaceholder: "+998 90 123 45 67",

    borrowingsTitle: "Borrowing Records & Loans",
    borrowingsSubtitle: "Track active 14-day loans, overdue debtors, and process return check-ins.",
    filterOpen: "Open (Active + Overdue)",
    filterOverdue: "Overdue Only",
    filterReturned: "Archive (Returned)",
    loanId: "Loan ID",
    bookTitle: "Book Title",
    borrower: "Borrower",
    issueDate: "Issue Date",
    dueDate: "Due Date (+14d)",
    status: "Status",

    adminsTitle: "Admin & Librarian Credentials",
    adminsSubtitle: "Manage authenticated operators with access to the closed library portal.",
    createOperator: "Create Operator",
    accessRestricted: "Access Restricted. Super Admin privileges required.",
    editAdmin: "Edit Operator",
    changePassword: "Change Password",
    newPasswordLabel: "New Password",
    deleteAdmin: "Delete Operator",
    confirmDeleteAdmin: "Are you sure you want to delete this operator?",
    adminUpdatedSuccess: "Operator updated successfully",
    passwordUpdatedSuccess: "Password updated successfully",
    adminDeletedSuccess: "Operator deleted successfully",
    actionsLabel: "Actions",
    roleLabel: "Role",
    createdAtLabel: "Created At",
    accessLevelLabel: "Access Level",
    fullControl: "Full control",
    borrowAndReturn: "Borrow & return books",
    roleAdminLabel: "Admin (Full access)",
    roleLibrarianLabel: "Librarian (Borrow & return)",
    passwordMinLengthHint: "At least 6 characters",
    cannotDeleteSelf: "You cannot delete your own account",

    selectedBooksCart: "Selected Books Cart",
    selectedBooksCount: "Selected Books",
    maxBooksLimitNotice: "You can select up to 5 books maximum",
    bookAlreadyInCart: "This book is already added to cart",
    cartEmptyNotice: "Please select at least one book",
    studentPhoneMissingHighlight: "Student phone number is not entered — enter to save",
    phoneSaveNote: "The entered phone number will be saved to the student profile upon loan issuance",
    automaticReturnDate: "Return Deadline (14 days)",
    daysOverdueCount: "+{days} days",
    tabAll: "All",
    tabActive: "Active",
    tabOverdue: "Overdue",
    tabReturned7d: "Returned (7-day archive)",
    tabFullHistory: "Full History",
    filterOverdueOnly: "Overdue Only",
    searchBorrowingsPlaceholder: "Search by student, staff, or book title...",
    confirmReturnTitle: "Book Return Check-in",
    confirmReturnMessage: "Are you sure you want to mark this book as returned?",
    returnSuccess: "Book successfully returned (+1 stock restored)",
    searchStudentPlaceholder: "Type student full name, group, or phone...",
    selectedStudent: "Selected Student",
    removeBook: "Remove",
    issueBooksSuccess: "Books successfully issued!",
    batchIssuingBooks: "Processing loan...",
    batchIssueButton: "Issue Books",
  },
};
