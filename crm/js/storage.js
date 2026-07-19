/* CRM Storage — data model matches the association member-company spreadsheet:
   company profile + capability tags + 2 representatives (with DOB) + yearly membership fees. */
const Storage = (() => {
  const KEY = 'crm_app_state_v1';

  const GROUP_COLORS = ['#7c9cff', '#f5a623', '#4fd1c5', '#f56565', '#b794f4', '#68d391', '#f6ad55', '#63b3ed'];

  const BUSINESS_TYPES = [
    { key: 'san_xuat', label: 'Sản xuất' },
    { key: 'thuong_mai', label: 'Thương mại' },
    { key: 'dich_vu', label: 'Dịch vụ' },
    { key: 'tu_van', label: 'Tư vấn' },
    { key: 'dao_tao', label: 'Đào tạo' },
  ];

  const CAPABILITIES = [
    { key: 'dap', label: 'Dập' },
    { key: 'khuon_ep', label: 'Khuôn ép' },
    { key: 'duc_nhua', label: 'Đúc nhựa' },
    { key: 'khuon_duc_nhua', label: 'Khuôn đúc nhựa' },
    { key: 'duc_cao_su', label: 'Đúc cao su' },
    { key: 'khuon_duc_cao_su', label: 'Khuôn đúc cao su' },
    { key: 'gia_cong_co_khi', label: 'Gia công cơ khí' },
    { key: 'kim_loai_tam', label: 'Kim loại tấm' },
    { key: 'duc_trong_luc', label: 'Đúc / Đúc trọng lực' },
    { key: 'ren', label: 'Rèn' },
    { key: 'dong_hop', label: 'Đóng hộp' },
    { key: 'xu_ly_be_mat', label: 'Xử lý bề mặt / Xi mạ' },
    { key: 'xu_ly_nhiet', label: 'Xử lý nhiệt' },
    { key: 'phu_kien_dien', label: 'Phụ kiện điện / điện tử' },
    { key: 'do_ga_jig', label: 'Đồ gá (JIG) / Công cụ' },
    { key: 'lap_rap', label: 'Lắp ráp' },
    { key: 'vat_lieu_kim_loai', label: 'Vật liệu (kim loại)' },
    { key: 'vat_lieu_nhua_cao_su', label: 'Vật liệu (nhựa, cao su)' },
    { key: 'bao_bi_in', label: 'Bao bì, in' },
    { key: 'dinh_bulong_ocvit', label: 'Đinh / Bù lông / Ốc vít' },
    { key: 'han', label: 'Hàn' },
    { key: 'che_tao_may', label: 'Chế tạo máy' },
    { key: 'tu_dong_hoa', label: 'Tự động hóa' },
  ];

  const TITLES = ['Ông', 'Bà'];

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function localISODate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function emptyContact(withAssociationRole) {
    return {
      title: 'Ông', name: '', position: '', degree: '',
      phone: '', email1: '', email2: '', dob: '',
      associationPosition: withAssociationRole ? '' : undefined,
    };
  }

  function emptyMembership() {
    return { contactName: '', contactPhone: '', contactEmail: '', joinDate: '', fees: [] };
  }

  function emptyCompany(groupId) {
    return {
      id: uid('cty'),
      code: '',
      nameVN: '',
      nameEN: '',
      businessTypes: [],
      capabilities: [],
      industry: '',
      addressRegistered: '',
      addressMailing: '',
      ward: '',
      establishedDate: '',
      revenue: '',
      exportPercent: '',
      laborSize: '',
      website: '',
      groupId: groupId || '',
      note: '',
      contacts: [emptyContact(true), emptyContact(false)],
      membership: emptyMembership(),
      createdAt: localISODate(new Date()),
    };
  }

  function seedState() {
    const groups = [
      { id: uid('grp'), name: 'HAMEE', color: GROUP_COLORS[0], createdAt: localISODate(new Date()) },
      { id: uid('grp'), name: 'HUBA', color: GROUP_COLORS[1], createdAt: localISODate(new Date()) },
      { id: uid('grp'), name: 'Sen Vàng', color: GROUP_COLORS[2], createdAt: localISODate(new Date()) },
    ];

    const names = [
      'Cơ Khí Duy Khanh', 'Nhựa Kỹ Thuật An Phát', 'Khuôn Mẫu Đông Nam', 'Cơ Khí Chính Xác Sài Gòn',
      'Đúc Kim Loại Việt Thắng', 'Tự Động Hóa Minh Long', 'Kim Loại Tấm Phú Thịnh', 'Cơ Khí Tân Á Châu',
      'Nhựa Cao Su Bình Dương', 'Xử Lý Bề Mặt Hoàng Gia', 'Gia Công CNC Đại Phát', 'Cơ Điện Tử Sao Nam',
    ];
    const firstNames = ['Nguyễn Văn', 'Trần Thị', 'Lê Hoàng', 'Phạm Minh', 'Hoàng Thu', 'Vũ Đức', 'Đặng Ngọc', 'Bùi Thanh'];
    const lastNames = ['An', 'Bình', 'Dũng', 'Hà', 'Khang', 'Linh', 'Minh', 'Phương', 'Quân', 'Trang'];
    const wards = ['P.Hòa Thạnh, Q.Tân Phú', 'P.Bình Hưng Hòa, Q.Bình Tân', 'P.Linh Trung, TP.Thủ Đức', 'KCN Sóng Thần, Dĩ An'];
    const laborSizes = ['<20 người', '20-50 người', '50-100 người', '100-300 người', '>300 người'];
    const today = new Date();

    const companies = names.map((n, i) => {
      const g = groups[i % groups.length];
      const rep1First = firstNames[i % firstNames.length];
      const rep1Last = lastNames[(i * 3) % lastNames.length];
      const rep2First = firstNames[(i + 4) % firstNames.length];
      const rep2Last = lastNames[(i * 5 + 1) % lastNames.length];

      const establishedYear = 1975 + Math.floor(Math.random() * 45);
      const nCaps = 2 + Math.floor(Math.random() * 4);
      const caps = [];
      while (caps.length < nCaps) {
        const c = CAPABILITIES[Math.floor(Math.random() * CAPABILITIES.length)].key;
        if (!caps.includes(c)) caps.push(c);
      }

      function randomDob(birthYear) {
        let mm, dd;
        if (i % 4 === 0) {
          const soon = new Date(today);
          soon.setDate(soon.getDate() + Math.floor(Math.random() * 30));
          mm = soon.getMonth() + 1; dd = soon.getDate();
        } else {
          mm = 1 + Math.floor(Math.random() * 12);
          dd = 1 + Math.floor(Math.random() * 28);
        }
        return `${birthYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
      }

      const joinYear = establishedYear + 5 + Math.floor(Math.random() * 15);
      const fees = [2024, 2025, 2026].map(year => {
        const paid = Math.random() > 0.3;
        return {
          year,
          fee: 3000000,
          paidDate: paid ? localISODate(new Date(year, Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 27))) : '',
          note: '',
        };
      });

      return {
        id: uid('cty'),
        code: `HV${String(i + 1).padStart(3, '0')}`,
        nameVN: `Công ty TNHH ${n}`,
        nameEN: n.split(' ').map(w => w).join(' ') + ' Co., Ltd.',
        businessTypes: ['san_xuat', ...(Math.random() > 0.6 ? ['thuong_mai'] : [])],
        capabilities: caps,
        industry: 'Cơ khí chính xác, khuôn mẫu, công nghiệp hỗ trợ',
        addressRegistered: `${10 + i} Đường số ${i + 1}, ${wards[i % wards.length]}, TP.HCM`,
        addressMailing: '',
        ward: wards[i % wards.length],
        establishedDate: `${establishedYear}-01-01`,
        revenue: `${(20 + i * 15)}-${(50 + i * 15)}`,
        exportPercent: `${Math.floor(Math.random() * 40)}`,
        laborSize: laborSizes[i % laborSizes.length],
        website: '',
        groupId: g.id,
        note: '',
        contacts: [
          {
            title: 'Ông', name: `${rep1First} ${rep1Last}`, position: 'Giám đốc', degree: 'Kỹ sư',
            phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
            email1: `${rep1Last.toLowerCase()}@${n.split(' ')[0].toLowerCase()}.vn`, email2: '',
            dob: randomDob(1965 + Math.floor(Math.random() * 25)),
            associationPosition: i === 0 ? 'Chủ tịch' : (i < 3 ? 'Phó chủ tịch' : ''),
          },
          {
            title: 'Bà', name: `${rep2First} ${rep2Last}`, position: 'Kế toán trưởng', degree: '',
            phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
            email1: `${rep2Last.toLowerCase()}.ketoan@${n.split(' ')[0].toLowerCase()}.vn`, email2: '',
            dob: randomDob(1970 + Math.floor(Math.random() * 25)),
          },
        ],
        membership: {
          contactName: `${rep2First} ${rep2Last}`,
          contactPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
          contactEmail: `${rep2Last.toLowerCase()}.thuky@${n.split(' ')[0].toLowerCase()}.vn`,
          joinDate: `${joinYear}-06-15`,
          fees,
        },
        createdAt: localISODate(new Date()),
      };
    });

    return { groups, companies, isSample: true, updatedAt: Date.now() };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const seeded = seedState();
        save(seeded);
        return seeded;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.groups || !parsed.companies) throw new Error('invalid state');
      return parsed;
    } catch (e) {
      const seeded = seedState();
      save(seeded);
      return seeded;
    }
  }

  function save(state) {
    state.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  let state = load();

  function getState() {
    return state;
  }

  function addGroup(name) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = state.groups.find(g => g.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const color = GROUP_COLORS[state.groups.length % GROUP_COLORS.length];
    const group = { id: uid('grp'), name: trimmed, color, createdAt: localISODate(new Date()) };
    state.groups.push(group);
    state.isSample = false;
    save(state);
    return group;
  }

  function renameGroup(id, name) {
    const g = state.groups.find(g => g.id === id);
    if (!g || !name.trim()) return;
    g.name = name.trim();
    save(state);
  }

  function deleteGroup(id) {
    state.groups = state.groups.filter(g => g.id !== id);
    state.companies = state.companies.filter(c => c.groupId !== id);
    save(state);
  }

  function addCompany(data) {
    const company = { ...emptyCompany(data.groupId), ...data, id: uid('cty'), createdAt: localISODate(new Date()) };
    state.companies.unshift(company);
    state.isSample = false;
    save(state);
    return company;
  }

  function updateCompany(id, data) {
    const idx = state.companies.findIndex(c => c.id === id);
    if (idx === -1) return;
    state.companies[idx] = { ...state.companies[idx], ...data, id };
    save(state);
  }

  function deleteCompany(id) {
    state.companies = state.companies.filter(c => c.id !== id);
    save(state);
  }

  function clearSampleData() {
    state = { groups: [], companies: [], isSample: false, updatedAt: Date.now() };
    save(state);
  }

  function replaceAll(newState) {
    state = { groups: newState.groups || [], companies: newState.companies || [], isSample: false, updatedAt: Date.now() };
    save(state);
  }

  // Every contact DOB across all companies, flattened for the birthday widget.
  function upcomingBirthdays(withinDays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results = [];
    state.companies.forEach(c => {
      (c.contacts || []).forEach((contact, idx) => {
        if (!contact || !contact.dob) return;
        const parts = contact.dob.split('-').map(Number);
        const mm = parts[1], dd = parts[2];
        if (!mm || !dd) return;
        let next = new Date(today.getFullYear(), mm - 1, dd);
        if (next < today) next = new Date(today.getFullYear() + 1, mm - 1, dd);
        const daysUntil = Math.round((next - today) / 86400000);
        if (daysUntil <= withinDays) {
          results.push({ company: c, contact, contactIndex: idx, daysUntil, nextDate: localISODate(next) });
        }
      });
    });
    results.sort((a, b) => a.daysUntil - b.daysUntil);
    return results;
  }

  function currentYearFeeStatus(company, year) {
    const entry = (company.membership && company.membership.fees || []).find(f => f.year === year);
    if (!entry) return 'missing';
    return entry.paidDate ? 'paid' : 'unpaid';
  }

  return {
    getState, addGroup, renameGroup, deleteGroup,
    addCompany, updateCompany, deleteCompany,
    clearSampleData, replaceAll,
    upcomingBirthdays, currentYearFeeStatus,
    emptyCompany, emptyContact, emptyMembership,
    BUSINESS_TYPES, CAPABILITIES, TITLES, GROUP_COLORS, localISODate,
  };
})();
