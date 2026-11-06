// Importar la conexión desde script.js
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
// 1. GESTIÓN DE SESIÓN Y AUTENTICACIÓN
// ==========================================

const loginForm = document.getElementById('loginForm');
const toggleAuth = document.getElementById('toggleAuth');
let esModoRegistro = false;

// Alternar entre Login y Registro en index.html
if (toggleAuth) {
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        esModoRegistro = !esModoRegistro;
        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        
        if (esModoRegistro) {
            btnSubmit.innerHTML = '<i class="bi bi-person-plus me-1"></i> Crear Cuenta';
            toggleAuth.textContent = "Volver al Iniciar Sesión";
        } else {
            btnSubmit.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión';
            toggleAuth.textContent = "Regístrate aquí";
        }
    });
}

// Enviar formulario (Login o Registro)
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            if (esModoRegistro) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("¡Cuenta creada exitosamente!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            window.location.href = "app.html";
        } catch (error) {
            alert("Error de autenticación: " + error.message);
        }
    });
}

// Proteger rutas y verificar estado del usuario
onAuthStateChanged(auth, (user) => {
    const esPaginaApp = window.location.pathname.includes('app.html');
    
    if (user) {
        const userEmailSpan = document.getElementById('userEmail');
        if (userEmailSpan) {
            userEmailSpan.innerHTML = `<i class="bi bi-person-circle me-1"></i> ${user.email}`;
        }
        
        if (esPaginaApp) {
            cargarApuntes(user.uid);
        }
    } else {
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
// 2. FIRESTORE: GUARDAR Y LEER APUNTES
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

            formApunte.reset();
            const modalElement = document.getElementById('modalApunte');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

        } catch (error) {
            alert("Error al guardar el apunte: " + error.message);
        }
    });
}

// Renderizar tarjetas de apuntes en app.html
function cargarApuntes(uid) {
    const contenedor = document.getElementById('contenedorApuntes');
    if (!contenedor) return;

    const q = query(collection(db, "apuntes"), where("uid", "==", uid));

    onSnapshot(q, (snapshot) => {
        contenedor.innerHTML = ""; 

        if (snapshot.empty) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-journal-x fs-1 text-secondary"></i>
                    <p class="mt-2 fw-semibold">No tienes apuntes guardados aún.</p>
                    <p class="small text-muted">Haz clic en <strong>"Nuevo Apunte"</strong> para registrar uno.</p>
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
                                <span class="badge bg-primary text-capitalize px-3 py-2 rounded-pill">${data.materia}</span>
                            </div>
                            <h5 class="card-title text-dark fw-bold">${data.titulo}</h5>
                            <p class="card-text text-secondary text-truncate-3">
                                ${data.contenido || 'Sin contenido escrito...'}
                            </p>
                        </div>
                        <div class="card-footer bg-transparent border-0 d-flex justify-content-end pb-3">
                            <button onclick="eliminarApunte('${id}')" class="btn btn-outline-danger btn-sm rounded-circle p-2" title="Eliminar Apunte">
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

// Función global para eliminar registros
window.eliminarApunte = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este apunte?")) {
        try {
            await deleteDoc(doc(db, "apuntes", id));
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    }
};