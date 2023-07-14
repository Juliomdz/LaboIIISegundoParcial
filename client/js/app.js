import { SuperHeroe } from "./superHeroe.js";
import {
    getHeroesFetch,
    postHeroAjax,
    putHeroAjax,
    deleteHeroFetch,
} from "./peticiones.js";
import { crearFiltrosColumnas } from "./filtros.js";

import {
    crearTabla,
    agregarFila,
    cargarAnuncios,
    agregarDetalles,
} from "./tabla.js";

let anuncios = [];

const cargarSelect = (armas) => {
    const $select = document.getElementById("armas");
    const fragment = document.createDocumentFragment();
    armas.forEach((arma) => {
        const opt = document.createElement("option");
        opt.innerText = arma;
        opt.value = arma;
        fragment.appendChild(opt);
    });

    $select.appendChild(fragment);
};

function mostrarBotonesEdicion() {
    let $botonCancelar = document.getElementById("btnCancelar");
    $botonCancelar.classList.add("visible");

    let $botonEliminar = document.getElementById("btnEliminar");
    $botonEliminar.classList.add("visible");
}

function ocultarBotonesEdicion() {
    let $botonCancelar = document.getElementById("btnCancelar");
    $botonCancelar.classList.remove("visible");

    let $botonEliminar = document.getElementById("btnEliminar");
    $botonEliminar.classList.remove("visible");
}

const limpiarCampos = () => {
    const { anuncioId, nombre, fuerza, alias, editorial, arma } = $form;

    anuncioId.value = "";
    nombre.value = "";
    fuerza.value = "500";
    alias.value = "";
    editorial.value = "marvel";
    arma.value = "Armadura";
};

const crearAnuncio = ({ nombre, alias, editorial, fuerza, arma }) => {
    let hayError = false;

    if (nombre.value.trim() == "") {
        document.getElementById("validacionNombre").classList.remove("oculto");
        hayError = true;
    } else {
        document.getElementById("validacionNombre").classList.add("oculto");
    }

    if (alias.value.trim() == "") {
        document.getElementById("validacionAlias").classList.remove("oculto");
        hayError = true;
    } else {
        document.getElementById("validacionAlias").classList.add("oculto");
    }

    if (hayError) return;

    let anuncio = new SuperHeroe(
        0,
        nombre.value,
        fuerza.value,
        alias.value,
        editorial.value,
        arma.value
    );

    $form.classList.add("spinner-oculto");
    document.getElementById("filtrosContainer").classList.add("oculto");
    document.getElementById("table-container").classList.add("spinner-oculto");
    document.querySelector(".spinner").classList.remove("spinner-oculto");
    postHeroAjax(anuncio, "http://localhost:3000/heroes");
};

const actualizarAnuncio = (
    anuncioId,
    { nombre, alias, editorial, fuerza, arma }
) => {
    const updatedHero = new SuperHeroe(
        anuncioId,
        nombre.value,
        fuerza.value,
        alias.value,
        editorial.value,
        arma.value
    );

    $form.classList.add("spinner-oculto");
    document.getElementById("filtrosContainer").classList.add("oculto");
    document.getElementById("table-container").classList.add("spinner-oculto");
    document.querySelector(".spinner").classList.remove("spinner-oculto");
    putHeroAjax(updatedHero, "http://localhost:3000/heroes");
};

const agregarAnuncio = (e) => {
    e.preventDefault();
    const { anuncioId } = $form;

    if (anuncioId.value === "") {
        crearAnuncio($form);
    } else {
        actualizarAnuncio(parseInt(anuncioId.value), $form);
    }
    ocultarBotonesEdicion();
};

const mostrarFiltros = () => {
    const $filtros = document.getElementById("filtrosContainer");
    $filtros.classList.remove("oculto");
};

const iniciarAplicacion = async () => {
    if (localStorage.getItem("armas") === null) {
        const armas = [
            "Armadura",
            "Espada",
            "Martillo",
            "Escudo",
            "Arma de fuego",
            "Flechas",
            "Musculos",
        ];
        localStorage.setItem("armas", JSON.stringify(armas));
        cargarSelect(armas);
    } else {
        const armas = JSON.parse(localStorage.getItem("armas"));
        cargarSelect(armas);
    }

    try {
        anuncios = await getHeroesFetch("http://localhost:3000/heroes");
        if (anuncios.length > 0) {
            crearTabla(anuncios);
            cargarAnuncios(anuncios);
            calcularPromedio(anuncios);
            calcularMaximo(anuncios); 
            calcularMinimo(anuncios); 
            crearFiltrosColumnas(anuncios[0]);
            mostrarFiltros();
            const checksFiltros = document.querySelectorAll(
                "div input[type=checkbox]"
            );
            checksFiltros.forEach((check) => {
                check.addEventListener("change", onChangeCheck);
            });
        }
    } catch (err) {
        console.log(err);
    } finally {
        document.querySelector(".spinner").classList.add("spinner-oculto");
        ocultarBotonesEdicion();
    }
};

const $form = document.forms[0];
$form.addEventListener("submit", agregarAnuncio);
document.addEventListener("DOMContentLoaded", iniciarAplicacion);

document.getElementById("btnCancelar").addEventListener("click", () => {
    limpiarCampos();
    ocultarBotonesEdicion();
});

document.getElementById("btnEliminar").addEventListener("click", async () => {
    let { anuncioId } = $form;
    anuncioId = parseInt(anuncioId.value);

    try {
        $form.classList.add("spinner-oculto");
        document.getElementById("filtrosContainer").classList.add("oculto");
        document
            .getElementById("table-container")
            .classList.add("spinner-oculto");
        document.querySelector(".spinner").classList.remove("spinner-oculto");
        await deleteHeroFetch("http://localhost:3000/heroes", anuncioId);
    } catch (err) {
        console.log(err);
    }
});

document.addEventListener("click", (e) => {
    let $element = e.target;
    if (
        $element !== null &&
        $element.parentNode !== null &&
        $element.parentNode.getAttribute("data-id")
    ) {
        const id = parseInt($element.parentNode.dataset.id);
        const anuncio = anuncios.find((a) => a.id === id);
        const { anuncioId, nombre, alias, editorial, fuerza, arma } = $form;

        anuncioId.value = id;
        nombre.value = anuncio.nombre;
        alias.value = anuncio.alias;
        editorial.value = anuncio.editorial;
        fuerza.value = anuncio.fuerza;
        arma.value = anuncio.arma;
        mostrarBotonesEdicion();
    }
});

document
    .getElementById("selectFiltros")
    .addEventListener("change", onChangeSelect);

function onChangeCheck(e) {
    let anunciosFiltrados = filtrarAnunciosPorEditorial(
        document.getElementById("selectFiltros").value,
        anuncios
    );
    anunciosFiltrados = obtenerAnunciosCheckeados(anunciosFiltrados);
    crearTabla(anunciosFiltrados);
    cargarAnuncios(anunciosFiltrados);
}

function obtenerAnunciosCheckeados(anuncios) {
    const checksFiltros = document.querySelectorAll("div input[type=checkbox]");

    return anuncios.map((a) => {
        let anuncioFiltrado = { id: a.id };

        checksFiltros.forEach((c) => {
            if (c.checked) {
                anuncioFiltrado[c.value] = a[c.value];
            }
        });
        return anuncioFiltrado;
    });
}

function onChangeSelect(e) {
    let anunciosFiltrados = filtrarAnunciosPorEditorial(
        e.target.value,
        anuncios
    );
    calcularPromedio(anunciosFiltrados);
    calcularMaximo(anunciosFiltrados);
    calcularMinimo(anunciosFiltrados);
    anunciosFiltrados = obtenerAnunciosCheckeados(anunciosFiltrados);
    crearTabla(anunciosFiltrados);
    cargarAnuncios(anunciosFiltrados);
}

function filtrarAnunciosPorEditorial(editorial, anuncios) {
    let anunciosFiltrados = [];

    if (editorial == "Marvel") {
        anunciosFiltrados = anuncios.filter((a) => a.editorial == "Marvel");
    } else if (editorial == "Dc Comics") {
        anunciosFiltrados = anuncios.filter((a) => a.editorial != "Marvel");
    } else {
        return anuncios;
    }
    return anunciosFiltrados;
}

function calcularPromedio(anuncios) {
    let fuerza = anuncios.reduce((acc, val) => acc + parseFloat(val.fuerza), 0);

    const $txtPromedio = document.getElementById("txtPromedio");
    $txtPromedio.value = (
        fuerza / (anuncios.length > 0 ? anuncios.length : 1)
    ).toFixed(2);
}

function calcularMaximo(anuncios) {
    let maximo = Number.MIN_VALUE;
  
    for (let i = 0; i < anuncios.length; i++) {
      const valor = parseFloat(anuncios[i].fuerza);
      if (valor > maximo) {
        maximo = valor;
      }
    }
    const $txtMaximo = document.getElementById("txtMaximo");
    $txtMaximo.value = maximo.toFixed(2);
  }

  function calcularMinimo(anuncios) {
    let minimo = Number.MAX_VALUE;
  
    for (let i = 0; i < anuncios.length; i++) {
      const valor = parseFloat(anuncios[i].fuerza);
      if (valor < minimo) {
        minimo = valor;
      }
    }
    const $txtMinimo = document.getElementById("txtMinimo");
    $txtMinimo.value = minimo.toFixed(2);
  }