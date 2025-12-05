// 1. CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://mmhetovgxylaevjhhsib.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1taGV0b3ZneHlsYWV2amhoc2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4OTY1NjAsImV4cCI6MjA4MDQ3MjU2MH0.C02LlADXmO-X27hhJXePPEWbt8YL1ABNMVCsIWDBjCA';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos del DOM
const feedContainer = document.getElementById('feed-container');
const btnUpload = document.getElementById('btn-upload');
const fileInput = document.getElementById('file-upload');
const modal = document.getElementById('upload-modal');
const previewImg = document.getElementById('preview-img');
const btnPublish = document.getElementById('btn-publish');
const btnCancel = document.getElementById('btn-cancel');
const captionInput = document.getElementById('caption-input');

let fileToUpload = null;

// 2. CARGAR EL FEED (READ)
async function loadFeed() {
    feedContainer.innerHTML = ''; // Limpiar
    
    // Select * from posts order by created_at desc
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) console.error('Error cargando posts:', error);

    posts.forEach(post => {
        const postHTML = `
            <div class="post">
                <div class="post-header">
                    <i class="fa-solid fa-circle-user" style="margin-right:8px;"></i>
                    ${post.username || 'Usuario Anónimo'}
                </div>
                <img src="${post.image_url}" class="post-image" loading="lazy">
                <div class="post-actions">
                    <i class="fa-regular fa-heart"></i>
                    <i class="fa-regular fa-comment"></i>
                    <i class="fa-regular fa-paper-plane"></i>
                </div>
                <div class="post-caption">
                    <strong>${post.username || 'Usuario'}</strong> ${post.caption}
                </div>
            </div>
        `;
        feedContainer.innerHTML += postHTML;
    });
}

// 3. MANEJO DE SUBIDA (CREATE)

// Click en el icono "+" abre el input de archivo
btnUpload.addEventListener('click', () => {
    fileInput.click();
});

// Cuando se selecciona un archivo
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileToUpload = file;
        previewImg.src = URL.createObjectURL(file);
        modal.classList.remove('hidden'); // Mostrar modal
    }
});

// Cancelar subida
btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
    fileInput.value = '';
});

// Publicar foto
btnPublish.addEventListener('click', async () => {
    if (!fileToUpload) return alert("Selecciona una imagen");
    
    btnPublish.textContent = "Subiendo...";
    const fileName = `public_${Date.now()}_${fileToUpload.name}`;

    // A. Subir imagen al Bucket 'images'
    const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, fileToUpload);

    if (error) {
        alert("Error subiendo imagen");
        console.error(error);
        btnPublish.textContent = "Publicar";
        return;
    }

    // B. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

    // C. Guardar registro en base de datos 'posts'
    const { error: dbError } = await supabase
        .from('posts')
        .insert([{
            username: 'UsuarioDemo', // Aquí iría el usuario real
            image_url: publicUrl,
            caption: captionInput.value
        }]);

    if (dbError) {
        alert("Error guardando post");
    } else {
        // Éxito: limpiar y recargar
        modal.classList.add('hidden');
        captionInput.value = '';
        fileInput.value = '';
        loadFeed(); // Recargar feed para ver la nueva foto
    }
    btnPublish.textContent = "Publicar";
});

// Inicializar
loadFeed();
