// 1. Conexión con tu archivo de configuración (script.js)
import { auth, db } from './script.js';

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    deleteDoc, 
    doc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. MANEJO DE SESIÓN Y USUARIOS (LOGIN / REGISTRO)
// ==========================================

const loginForm = document.getElementById('loginForm');
const toggleAuth = document.getElementById('toggleAuth');
let esModoRegistro = false;

// Cambiar entre Formulario de Login y Registro (en index.html)
if (toggleAuth) {
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        esModoRegistro = !esModoRegistro;
        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        
        if (esModoRegistro) {
            btnSubmit.textContent = "Registrarse";
            toggleAuth.textContent = "Volver al Iniciar Sesión";
        } else {
            btnSubmit.textContent = "Iniciar Sesión";
            toggleAuth.textContent = "Regístrate aquí";
        }
    });
}

// Evento de envío del formulario Login/Registro
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            if (esModoRegistro) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("¡Cuenta creada exitosamente! Entrando...");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            window.location.href = "app.html";
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

// Comprobar estado del usuario y proteger rutas
onAuthStateChanged(auth, (user) => {
    const esPaginaApp = window.location.pathname.includes('app.html');
    
    if (user) {
        // Usuario autenticado
        const userEmailSpan = document.getElementById('userEmail');
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        
        if (esPaginaApp) {
            cargarApuntes(user.uid);
        }
    } else {
        // Si no está autenticado y está intentando entrar a app.html
        if (esPaginaApp) {
            window.location.href = "index.html";
        }
    }
});

// Cerrar Sesión
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });
}

// ==========================================
// 2. GUARDAR Y MOSTRAR APUNTES (FIRESTORE)
// ==========================================

const formApunte = document.getElementById('formApunte');
if (formApunte) {
    formApunte.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;

        if (!user) return;

        const materia = document.getElementById('materia').value;
        const titulo = document.getElementById('titulo').value;
        const contenido = document.getElementById('contenido').value;

        try {
            await addDoc(collection(db, "apuntes"), {
                uid: user.uid,
                materia: materia,
                titulo: titulo,
                contenido: contenido,
                fecha: serverTimestamp()
            });

            // Limpiar y cerrar el modal de Bootstrap
            formApunte.reset();
            const modalElement = document.getElementById('modalApunte');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

        } catch (error) {
            alert("Error al guardar el apunte: " + error.message);
        }
    });
}

// Escuchar cambios en Firestore y renderizar en pantalla
function cargarApuntes(uid) {
    const contenedor = document.getElementById('contenedorApuntes');
    if (!contenedor) return;

    const q = query(collection(db, "apuntes"), where("uid", "==", uid));

    onSnapshot(q, (snapshot) => {
        contenedor.innerHTML = ""; // Limpiar contenedor

        if (snapshot.empty) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-journal-x fs-1"></i>
                    <p class="mt-2">No tienes apuntes guardados aún. Haz clic en <strong>"Nuevo Apunte"</strong> para agregar uno.</p>
                </div>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const cardHTML = `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0 tarjeta-apunte">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-primary text-capitalize">${data.materia}</span>
                            </div>
                            <h5 class="card-title text-dark fw-bold">${data.titulo}</h5>
                            <p class="card-text text-secondary text-truncate-3">
                                ${data.contenido || 'Sin contenido de texto...'}
                            </p>
                        </div>
                        <div class="card-footer bg-transparent border-0 d-flex justify-content-end gap-2 pb-3">
                            <button onclick="eliminarApunte('${id}')" class="btn btn-outline-danger btn-sm" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += cardHTML;
        });
    });
}

// Función global para eliminar apunte
window.eliminarApunte = async (id) => {
    if (confirm("¿Estás seguro de eliminar este apunte?")) {
        try {
            await deleteDoc(doc(db, "apuntes", id));
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    }
};