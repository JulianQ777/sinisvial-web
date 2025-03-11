document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales y selects
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
  
    // Token de Mapbox (reemplaza con tu token)
    mapboxgl.accessToken = 'pk.eyJ1IjoibG9iZXRlNzciLCJhIjoiY204M213eW1tMDR6OTJrb2tlMGhhc2d5eCJ9.0K4Ci4sixdHbLiCjsU4OAA';
  
    // Inicializar el mapa centrado en Bogotá, Colombia
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.0721, 4.7110], // Coordenadas de Bogotá
      zoom: 12
    });
  
    // Marcadores
    let markers = [];
    let currentMarker = null;
  
    // Imágenes personalizadas para los marcadores
    const markerImages = {
      danger: 'https://cdn-icons-png.flaticon.com/512/3522/3522691.png', // Peligro
      caution: 'https://cdn-icons-png.flaticon.com/512/3522/3522697.png', // Precaución
      'no-entry': 'https://cdn-icons-png.flaticon.com/512/3522/3522677.png', // No pasar
      accident: 'https://cdn-icons-png.flaticon.com/512/3522/3522683.png', // Accidente
    };
  
    // Registro de usuarios (almacenamiento local)
    const users = JSON.parse(localStorage.getItem('users')) || [];
  
    // Mostrar modal de login al cargar la aplicación
    M.Modal.getInstance(document.getElementById('login')).open();
  
    // Validar nombre y contraseña (sin espacios en blanco)
    function validateInput(input) {
      return input.trim() !== '' && !input.includes(' ');
    }
  
    // Login
    document.getElementById('login-submit').addEventListener('click', function() {
      const name = document.getElementById('login-name').value;
      const password = document.getElementById('login-password').value;
  
      if (!validateInput(name) || !validateInput(password)) {
        alert('Nombre y contraseña no pueden contener espacios en blanco.');
        return;
      }
  
      const user = users.find(u => u.name === name && u.password === password);
  
      if (user) {
        alert('Ingreso exitoso.');
        M.Modal.getInstance(document.getElementById('login')).close();
      } else {
        alert('Nombre o contraseña incorrectos.');
      }
    });
  
    // Ingresar sin registrar
    document.getElementById('login-guest').addEventListener('click', function() {
      alert('Ingresando como invitado.');
      M.Modal.getInstance(document.getElementById('login')).close();
    });
  
    // Registro
    document.getElementById('register-submit').addEventListener('click', function() {
      const name = document.getElementById('register-name').value;
      const password = document.getElementById('register-password').value;
  
      if (!validateInput(name) || !validateInput(password)) {
        alert('Nombre y contraseña no pueden contener espacios en blanco.');
        return;
      }
  
      if (name && password) {
        users.push({ name, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Registro exitoso.');
        M.Modal.getInstance(document.getElementById('register')).close();
        M.Modal.getInstance(document.getElementById('login')).close(); // Cerrar login después de registro
      } else {
        alert('Por favor, completa todos los campos.');
      }
    });
  
    // Buscar dirección
    document.getElementById('search-address').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query === '') {
          alert('Por favor, ingresa una dirección.');
          return;
        }
  
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`)
          .then(response => response.json())
          .then(data => {
            if (data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              map.flyTo({ center: [lng, lat], zoom: 15 });
            } else {
              alert('Dirección no encontrada.');
            }
          })
          .catch(error => {
            console.error('Error al buscar la dirección:', error);
            alert('Hubo un problema al buscar la dirección.');
          });
      }
    });
  
    // Reportar incidente
    document.getElementById('confirmar-reporte').addEventListener('click', function() {
      const descripcion = document.getElementById('incidente-descripcion').value;
      const tipoMarcador = document.getElementById('tipo-marcador').value;
  
      if (descripcion.trim() === '') {
        alert('Por favor, ingresa una descripción.');
        return;
      }
  
      alert('Ahora haz clic en el mapa para colocar el marcador.');
      M.Modal.getInstance(document.getElementById('reportar')).close();
  
      map.once('click', function(e) {
        if (currentMarker) {
          alert('Solo puedes colocar un marcador por reporte. Genera un nuevo reporte para agregar otro.');
          return;
        }
  
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.style.backgroundImage = `url(${markerImages[tipoMarcador]})`;
        markerElement.style.width = '30px';
        markerElement.style.height = '30px';
        markerElement.style.backgroundSize = 'cover';
  
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat(e.lngLat)
          .addTo(map);
  
        marker.getElement().addEventListener('click', () => {
          document.getElementById('marker-description-text').textContent = descripcion;
          M.Modal.getInstance(document.getElementById('marker-description')).open();
        });
  
        markers.push({ marker, descripcion, tipoMarcador });
        currentMarker = marker; // Guardar el marcador actual
      });
    });
  
    // Eliminar marcador
    window.deleteMarker = function(index) {
      if (index >= 0 && index < markers.length) {
        markers[index].marker.remove(); // Eliminar el marcador del mapa
        markers.splice(index, 1); // Eliminar el marcador de la lista
        currentMarker = null; // Reiniciar el marcador actual
        M.Modal.getInstance(document.getElementById('markers-list')).close();
      }
    };
  
    // Mostrar lista de marcadores
    document.getElementById('show-markers-btn').addEventListener('click', function() {
      const listContent = markers.map((marker, index) => `
        <li>
          <strong>Marcador ${index + 1}:</strong> ${marker.descripcion}
          <button class="btn red" onclick="deleteMarker(${index})">Eliminar</button>
        </li>
      `).join('');
      document.getElementById('markers-list-content').innerHTML = listContent;
      M.Modal.getInstance(document.getElementById('markers-list')).open();
    });
  
    // Botón de emergencia
    document.getElementById('llamar-emergencia').addEventListener('click', function() {
      alert('Llamando al 911...');
      // Aquí podrías integrar una API para llamadas de emergencia.
    });
  
    // Tutorial
    document.getElementById('tutorial-btn').addEventListener('click', function() {
      const instance = M.Modal.getInstance(document.getElementById('tutorial'));
      instance.open();
    });
  
    // Reportar incidente desde el botón
    document.getElementById('report-btn').addEventListener('click', function() {
      const instance = M.Modal.getInstance(document.getElementById('reportar'));
      instance.open();
    });
  
    // Emergencia desde el botón
    document.getElementById('emergency-btn').addEventListener('click', function() {
      const instance = M.Modal.getInstance(document.getElementById('emergencia'));
      instance.open();
    });
  });