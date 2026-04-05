let artikel = [];
let currentEditingArtikelId = null;
let artikelSearchQuery = '';

let submissions = [];
let currentSubmissionFilter = 'semua';
let submissionSearchQuery = '';
let currentEditingSubmissionId = null;

const STATUS_ORDER = ['dikirim', 'direview', 'selesai'];

document.addEventListener('DOMContentLoaded', () => {
    loadArtikel();
    loadSubmissions();
    bindForms();
    renderArtikel();
    renderSubmissions();
    updateSubmissionStats();
});

function bindForms() {
    const artikelForm = document.getElementById('artikelForm');
    if (artikelForm) {
        artikelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            tambahArtikel();
        });
    }

    const submissionForm = document.getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitSubmission();
        });
    }
}

function loadArtikel() {
    const saved = localStorage.getItem('agamaArtikel');
    if (saved) artikel = JSON.parse(saved);
}

function saveArtikel() {
    localStorage.setItem('agamaArtikel', JSON.stringify(artikel));
}

function loadSubmissions() {
    const saved = localStorage.getItem('agamaSubmissions');
    if (saved) {
        submissions = JSON.parse(saved);
        return;
    }

    submissions = [
        {
            id: Date.now(),
            student: 'Ahmad Fauzi',
            kelas: 'XI IPA 1',
            title: 'Rangkuman Materi Aqidah',
            subject: 'Aqidah',
            deadline: nextDate(2),
            fileName: 'aqidah-ahmad.pdf',
            submittedAt: new Date().toLocaleDateString('id-ID'),
            status: 'dikirim'
        },
        {
            id: Date.now() + 1,
            student: 'Siti Rahma',
            kelas: 'XI IPA 2',
            title: 'Esai Akhlak Islami',
            subject: 'Akhlak',
            deadline: nextDate(4),
            fileName: 'esai-akhlak-siti.docx',
            submittedAt: new Date().toLocaleDateString('id-ID'),
            status: 'direview'
        }
    ];
    saveSubmissions();
}

function saveSubmissions() {
    localStorage.setItem('agamaSubmissions', JSON.stringify(submissions));
}

function nextDate(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().slice(0, 10);
}

function tambahArtikel() {
    const judulEl = document.getElementById('artikelJudul');
    const deskripsiEl = document.getElementById('artikelDeskripsi');
    const kategoriEl = document.getElementById('artikelKategori');
    if (!judulEl || !deskripsiEl || !kategoriEl) return;

    const judul = judulEl.value.trim();
    const deskripsi = deskripsiEl.value.trim();
    const kategori = kategoriEl.value;

    if (!judul || !deskripsi || !kategori) {
        alert('Semua field harus diisi!');
        return;
    }

    artikel.push({
        id: Date.now(),
        judul,
        deskripsi,
        kategori,
        tanggal: new Date().toLocaleDateString('id-ID')
    });

    saveArtikel();
    renderArtikel();

    const form = document.getElementById('artikelForm');
    if (form) form.reset();
}

function renderArtikel() {
    const list = document.getElementById('artikelList');
    const empty = document.getElementById('emptyArtikel');
    if (!list || !empty) return;

    list.innerHTML = '';

    const filtered = artikel.filter((art) => {
        const query = artikelSearchQuery.trim();
        if (!query) return true;
        const haystack = `${art.judul} ${art.deskripsi} ${art.kategori}`.toLowerCase();
        return haystack.includes(query);
    });

    const artikelCount = document.getElementById('artikelCount');
    const artikelMetric = document.getElementById('artikelMetric');
    if (artikelCount) artikelCount.textContent = String(artikel.length);
    if (artikelMetric) artikelMetric.textContent = String(artikel.length);

    if (!filtered.length) {
        empty.classList.add('show');
        empty.innerHTML = artikelSearchQuery.trim()
            ? '<p>Tidak ada artikel yang cocok dengan pencarian Anda.</p>'
            : '<p>Belum ada artikel. Mulai dengan menambahkan artikel baru!</p>';
        return;
    }

    empty.classList.remove('show');

    filtered.forEach((art) => {
        const li = document.createElement('li');
        li.className = 'artikel-item';
        li.innerHTML = `
            <div class="artikel-header">
                <div class="artikel-info">
                    <div class="artikel-judul">${escapeHtml(art.judul)}</div>
                    <div class="artikel-meta">
                        <span>${art.tanggal}</span>
                        <span class="artikel-kategori">${escapeHtml(art.kategori)}</span>
                    </div>
                </div>
                <div class="artikel-actions">
                    <button class="artikel-btn artikel-btn-submit" onclick="prepareSubmissionFromArtikel(${art.id})">Kumpulkan</button>
                    <button class="artikel-btn artikel-btn-edit" onclick="editArtikel(${art.id})">✎</button>
                    <button class="artikel-btn artikel-btn-delete" onclick="hapusArtikel(${art.id})">🗑</button>
                </div>
            </div>
            <div class="artikel-deskripsi">${escapeHtml(art.deskripsi)}</div>
        `;
        list.appendChild(li);
    });
}

function searchArtikel(query) {
    artikelSearchQuery = query.toLowerCase();
    renderArtikel();
}

function editArtikel(id) {
    const art = artikel.find((item) => item.id === id);
    if (!art) return;

    const judulEl = document.getElementById('editArtikelJudul');
    const deskripsiEl = document.getElementById('editArtikelDeskripsi');
    const kategoriEl = document.getElementById('editArtikelKategori');
    const modal = document.getElementById('editArtikelModal');
    if (!judulEl || !deskripsiEl || !kategoriEl || !modal) return;

    currentEditingArtikelId = id;
    judulEl.value = art.judul;
    deskripsiEl.value = art.deskripsi;
    kategoriEl.value = art.kategori;
    modal.classList.add('show');
}

function simpanEditArtikel() {
    const judulEl = document.getElementById('editArtikelJudul');
    const deskripsiEl = document.getElementById('editArtikelDeskripsi');
    const kategoriEl = document.getElementById('editArtikelKategori');
    if (!judulEl || !deskripsiEl || !kategoriEl) return;

    const judul = judulEl.value.trim();
    const deskripsi = deskripsiEl.value.trim();
    const kategori = kategoriEl.value;

    if (!judul || !deskripsi || !kategori) {
        alert('Semua field harus diisi!');
        return;
    }

    const art = artikel.find((item) => item.id === currentEditingArtikelId);
    if (!art) return;

    art.judul = judul;
    art.deskripsi = deskripsi;
    art.kategori = kategori;

    saveArtikel();
    renderArtikel();
    closeArtikelModal();
}

function hapusArtikel(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;

    artikel = artikel.filter((item) => item.id !== id);
    saveArtikel();
    renderArtikel();
}

function closeArtikelModal() {
    const modal = document.getElementById('editArtikelModal');
    if (modal) modal.classList.remove('show');
    currentEditingArtikelId = null;
}

function scrollToSubmissionForm() {
    const target = document.getElementById('task');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
}

function prepareSubmissionFromArtikel(artikelId) {
    const selected = artikel.find((item) => item.id === artikelId);
    if (!selected) return;

    const titleEl = document.getElementById('submissionTitle');
    const subjectEl = document.getElementById('submissionSubject');
    const deadlineEl = document.getElementById('submissionDeadline');
    const studentEl = document.getElementById('submissionStudent');
    const target = document.getElementById('task');
    if (!titleEl || !subjectEl || !deadlineEl || !studentEl || !target) return;

    titleEl.value = selected.judul;
    subjectEl.value = selected.kategori;

    if (!deadlineEl.value) {
        deadlineEl.value = nextDate(3);
    }

    target.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => studentEl.focus(), 400);
}

function submitSubmission() {
    const studentEl = document.getElementById('submissionStudent');
    const classEl = document.getElementById('submissionClass');
    const titleEl = document.getElementById('submissionTitle');
    const subjectEl = document.getElementById('submissionSubject');
    const deadlineEl = document.getElementById('submissionDeadline');
    const fileEl = document.getElementById('submissionFile');

    if (!studentEl || !classEl || !titleEl || !subjectEl || !deadlineEl || !fileEl) return;

    const student = studentEl.value.trim();
    const kelas = classEl.value.trim();
    const title = titleEl.value.trim();
    const subject = subjectEl.value;
    const deadline = deadlineEl.value;
    const fileName = fileEl.files && fileEl.files[0] ? fileEl.files[0].name : 'Tanpa lampiran';

    if (!student || !kelas || !title || !subject || !deadline) {
        alert('Nama, kelas, judul, mata pelajaran, dan deadline wajib diisi.');
        return;
    }

    submissions.unshift({
        id: Date.now(),
        student,
        kelas,
        title,
        subject,
        deadline,
        fileName,
        submittedAt: new Date().toLocaleDateString('id-ID'),
        status: 'dikirim'
    });

    saveSubmissions();
    renderSubmissions();
    updateSubmissionStats();

    const form = document.getElementById('submissionForm');
    if (form) form.reset();
}

function renderSubmissions() {
    const list = document.getElementById('submissionList');
    const empty = document.getElementById('emptySubmission');
    if (!list || !empty) return;

    list.innerHTML = '';

    let filtered = submissions;
    if (currentSubmissionFilter !== 'semua') {
        filtered = filtered.filter((item) => item.status === currentSubmissionFilter);
    }

    filtered = filtered.filter((item) => {
        const query = submissionSearchQuery.trim();
        if (!query) return true;
        const haystack = `${item.student} ${item.kelas} ${item.title} ${item.subject}`.toLowerCase();
        return haystack.includes(query);
    });

    if (!filtered.length) {
        empty.classList.add('show');
        empty.innerHTML = submissionSearchQuery.trim()
            ? '<p>Tidak ada data pengumpulan yang sesuai pencarian.</p>'
            : '<p>Belum ada pengumpulan tugas. Silakan kirim tugas pertama Anda.</p>';
        return;
    }

    empty.classList.remove('show');

    filtered.forEach((item) => {
        const statusLabel = getSubmissionStatusLabel(item.status);
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-header">
                <div class="task-title-section">
                    <div class="task-description">${escapeHtml(item.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority sedang">${escapeHtml(item.subject)}</span>
                        <span class="task-status ${statusLabel.className}">${statusLabel.text}</span>
                        <span class="task-deadline">Deadline: ${formatDate(item.deadline)}</span>
                    </div>
                    <p class="submission-line">${escapeHtml(item.student)} | ${escapeHtml(item.kelas)} | Dikirim: ${escapeHtml(item.submittedAt)}</p>
                    <p class="submission-line">Lampiran: ${escapeHtml(item.fileName)}</p>
                </div>
                <div class="task-actions">
                    <button class="task-btn task-btn-check" onclick="advanceSubmissionStatus(${item.id})" title="Ubah Status">↻</button>
                    <button class="task-btn task-btn-edit" onclick="openSubmissionEditModal(${item.id})" title="Edit">✎</button>
                    <button class="task-btn task-btn-delete" onclick="deleteSubmission(${item.id})" title="Hapus">🗑</button>
                </div>
            </div>
        `;
        list.appendChild(li);
    });

    updateSubmissionStats();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('id-ID');
}

function getSubmissionStatusLabel(status) {
    if (status === 'direview') return { text: 'Direview', className: 'active' };
    if (status === 'selesai') return { text: 'Selesai', className: 'done' };
    return { text: 'Dikirim', className: 'pending' };
}

function updateSubmissionStats() {
    const total = submissions.length;
    const sent = submissions.filter((item) => item.status === 'dikirim').length;
    const reviewed = submissions.filter((item) => item.status === 'direview').length;
    const done = submissions.filter((item) => item.status === 'selesai').length;

    const countEl = document.getElementById('submissionCount');
    const totalEl = document.getElementById('totalSubmission');
    const sentEl = document.getElementById('sentSubmission');
    const reviewEl = document.getElementById('reviewSubmission');
    const doneEl = document.getElementById('doneSubmission');
    const metricEl = document.getElementById('submissionMetric');

    if (countEl) countEl.textContent = String(total);
    if (totalEl) totalEl.textContent = String(total);
    if (sentEl) sentEl.textContent = String(sent);
    if (reviewEl) reviewEl.textContent = String(reviewed);
    if (doneEl) doneEl.textContent = String(done);
    if (metricEl) metricEl.textContent = String(total);
}

function searchSubmission(query) {
    submissionSearchQuery = query.toLowerCase();
    renderSubmissions();
}

function filterSubmission(filter, button) {
    currentSubmissionFilter = filter;

    document.querySelectorAll('#task .filter-btn').forEach((btn) => {
        btn.classList.remove('active');
    });
    if (button) button.classList.add('active');

    renderSubmissions();
}

function advanceSubmissionStatus(id) {
    const item = submissions.find((submission) => submission.id === id);
    if (!item) return;

    const currentIndex = STATUS_ORDER.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % STATUS_ORDER.length;
    item.status = STATUS_ORDER[nextIndex];

    saveSubmissions();
    renderSubmissions();
    updateSubmissionStats();
}

function openSubmissionEditModal(id) {
    const item = submissions.find((submission) => submission.id === id);
    if (!item) return;

    const modal = document.getElementById('editSubmissionModal');
    const studentEl = document.getElementById('editSubmissionStudent');
    const classEl = document.getElementById('editSubmissionClass');
    const titleEl = document.getElementById('editSubmissionTitle');
    const subjectEl = document.getElementById('editSubmissionSubject');
    const deadlineEl = document.getElementById('editSubmissionDeadline');
    if (!modal || !studentEl || !classEl || !titleEl || !subjectEl || !deadlineEl) return;

    currentEditingSubmissionId = id;
    studentEl.value = item.student;
    classEl.value = item.kelas;
    titleEl.value = item.title;
    subjectEl.value = item.subject;
    deadlineEl.value = item.deadline;
    modal.classList.add('show');
}

function saveSubmissionEdit() {
    const studentEl = document.getElementById('editSubmissionStudent');
    const classEl = document.getElementById('editSubmissionClass');
    const titleEl = document.getElementById('editSubmissionTitle');
    const subjectEl = document.getElementById('editSubmissionSubject');
    const deadlineEl = document.getElementById('editSubmissionDeadline');
    if (!studentEl || !classEl || !titleEl || !subjectEl || !deadlineEl) return;

    const student = studentEl.value.trim();
    const kelas = classEl.value.trim();
    const title = titleEl.value.trim();
    const subject = subjectEl.value;
    const deadline = deadlineEl.value;

    if (!student || !kelas || !title || !subject || !deadline) {
        alert('Semua field utama wajib diisi.');
        return;
    }

    const item = submissions.find((submission) => submission.id === currentEditingSubmissionId);
    if (!item) return;

    item.student = student;
    item.kelas = kelas;
    item.title = title;
    item.subject = subject;
    item.deadline = deadline;

    saveSubmissions();
    renderSubmissions();
    updateSubmissionStats();
    closeSubmissionModal();
}

function closeSubmissionModal() {
    const modal = document.getElementById('editSubmissionModal');
    if (modal) modal.classList.remove('show');
    currentEditingSubmissionId = null;
}

function deleteSubmission(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengumpulan ini?')) return;

    submissions = submissions.filter((item) => item.id !== id);
    saveSubmissions();
    renderSubmissions();
    updateSubmissionStats();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeArtikelModal();
        closeSubmissionModal();
    }
});

window.addEventListener('click', (e) => {
    const artikelModal = document.getElementById('editArtikelModal');
    const submissionModal = document.getElementById('editSubmissionModal');

    if (artikelModal && e.target === artikelModal) closeArtikelModal();
    if (submissionModal && e.target === submissionModal) closeSubmissionModal();
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
