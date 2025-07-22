        // Global variables
        let currentUser = null;
        let cart = [];
        let promoApplied = false;
        let promoDiscount = 0;
        let map = null;
        let kitchenMarker = null;
        let userMarker = null;
        let deliveryVehicle = null;
        let routeLine = null;
        let currentOrder = null;

        // Kitchen location (fixed)
        const kitchenLocation = [27.406961, 80.126763]; // Sample coordinates

        // Food menu data
        const menuItems = [
            { id: 1, name: "Veg Thali", price: 120, category: "veg", rating: 4.5, image: "images/VT.jfif", description: "3 sabzis, dal, rice, roti, salad, pickle,curd" },
            { id: 2, name: "Chicken Biryani", price: 349, category: "non-veg", rating: 4.8, image: "images/cb.jfif", description: "Aromatic basmati rice with tender chicken" },
            { id: 3, name: "Protein Bowl", price: 149, category: "non-veg", rating: 4.2, image: "images/PB.jfif", description: "Grilled paneer/chicken, quinoa, veggies, and hummus" },
            { id: 4, name: "Dal Tadka", price: 100, category: "veg", rating: 4.7, image: "images/DT.jfif", description: "Yellow dal cooked with Indian spices" },
            { id: 5, name: "Veg Sandwich", price: 79, category: "veg", rating: 4.6, image: "images/VS.jfif", description: "Low fat sandwich filled with veggies and cheese" },
            { id: 6, name: "Mutton Curry", price: 429, category: "non-veg", rating: 4.4, image: "images/MC.jfif", description: "Delicious mutton curry made with Indian spices" },
            { id: 7, name: "Sprouts Bowl", price: 150, category: "veg", rating: 4.3, image: "images/sb.jfif", description: "A base of sprouted beans, like mung beans, along with fresh vegetables, herbs, and spices" },
            { id: 8, name: "Chole Bhature", price: 99, category: "veg", rating: 4.6, image: "images/CBh.jfif", description: "Spicy chickpea curry (chole) paired with deep-fried bread (bhature)" }
        ];

        // Initialize app
        document.addEventListener('DOMContentLoaded', function () {
            // Check if user is logged in
            const userData = localStorage.getItem('flavorcrateUser');
            if (!userData) {
                window.location.href = 'login.html';
                return;
            }

            currentUser = JSON.parse(userData);
            initializeApp();
        });

        function initializeApp() {
            updateUI();
            renderMenu();
            initializeMap();
            // loadOrderHistory();
            setupEventListeners();
        }

        function updateUI() {
            document.getElementById('userName').textContent = currentUser.username;
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.username}!`;

            // Update profile dropdown
            document.getElementById('profileUsername').textContent = currentUser.username;
            document.getElementById('profileEmail').textContent = currentUser.email;
            document.getElementById('profilePhone').textContent = currentUser.phone;
            document.getElementById('profileAddress').textContent = currentUser.address;
        }

        function applyPromoCode() {
            const code = document.getElementById('promoCode').value.trim().toUpperCase();
            const status = document.getElementById('promoStatus');

            // Example promo logic
            if (code.toUpperCase() === "FLAVOR50" && !promoApplied) {
                promoDiscount = 50;
                promoApplied = true;
                status.textContent = "₹50 off applied!";
                status.classList.remove("hidden");
                updateCartUI();
            } else if (promoApplied) {
                status.textContent = "Promo already applied.";
                status.classList.remove("hidden");
            } else {
                status.textContent = "Invalid promo code.";
                status.classList.remove("hidden");
                status.classList.remove("text-green-600");
                status.classList.add("text-red-600");
            }
        }
        document.getElementById('applyPromoBtn').addEventListener('click', applyPromoCode);

        function renderMenu(filter = 'all') {
            const menuContainer = document.getElementById('foodMenu');
            const filteredItems = filter === 'all' ? menuItems : menuItems.filter(item => item.category === filter);

            menuContainer.innerHTML = filteredItems.map(item => {
                const cartItem = cart.find(ci => ci.id === item.id);
                const quantityControl = cartItem ? `
            <div class="flex items-center space-x-2">
                <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">-</button>
                <span class="text-sm font-medium w-6 text-center">${cartItem.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 bg-green-500 text-white rounded-full text-xs hover:bg-green-600">+</button>
            </div>
        ` : `
            <button onclick="addToCart(${item.id})" class="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition text-sm font-medium">
                Add to Cart
            </button>
        `;

                return `
            <div class="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md" />
                            <div>
                                <h4 class="font-semibold text-lg">${item.name}</h4>
                                <div class="flex items-center space-x-1 text-sm text-gray-600">
                                    <span>⭐</span>
                                    <span>${item.rating}</span>
                                </div>
                            </div>
                        </div>
                        <span class="text-lg font-bold text-orange-600">₹${item.price}</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">${item.description}</p>
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${item.category === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${item.category === 'veg' ? '🌱 Veg' : '🍖 Non-Veg'}
                        </span>
                        ${quantityControl}
                    </div>
                </div>
            </div>
        `;
            }).join('');
        }



        function addToCart(itemId) {
            const item = menuItems.find(i => i.id === itemId);
            const existingItem = cart.find(i => i.id === itemId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...item, quantity: 1 });
            }

            updateCartUI();
            renderMenu();
        }

        function updateCartUI() {
            const cartContainer = document.getElementById('cartItems');
            const cartCount = document.getElementById('cartCount');
            const cartTotal = document.getElementById('cartTotal');
            const totalAmount = document.getElementById('totalAmount');

            if (cart.length === 0) {
                cartContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Your cart is empty</p>';
                cartTotal.classList.add('hidden');
                cartCount.textContent = '0';
                return;
            }

            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            let discount = promoApplied ? promoDiscount : 0;
            let discountedTotal = Math.max(subtotal - discount, 0);
            let deliveryCharge = discountedTotal < 199 ? 20 : 0;
            let finalTotal = discountedTotal + deliveryCharge;

            cartCount.textContent = totalItems;

            // Update DOM
            totalAmount.innerHTML = `
    <div class="mt- border-t pt-4 text-sm text-gray-700 space-y-2">
        <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>₹${subtotal}</span>
        </div>
        ${discount > 0 ? `
        <div class="flex justify-between text-green-600">
            <span>Discount:</span>
            <span>-₹${discount}</span>
        </div>` : ""}
        
        <div class="flex justify-between">
            <span>Delivery:</span>
            <span>₹${deliveryCharge}</span>
        </div>
        <div class="flex justify-between font-bold text-base text-gray-900 border-t pt-3">
            <span>Total:</span>
            <span>₹${finalTotal.toFixed(2)}</span>
        </div>
    </div>
`;



            cartTotal.classList.remove('hidden');

            cartContainer.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div class="flex-1">
                <div class="font-medium text-sm">${item.name}</div>
                <div class="text-xs text-gray-600">₹${item.price} each</div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition">-</button>
                <span class="text-sm font-medium w-8 text-center">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition">+</button>
            </div>
        </div>
    `).join('');
        }


        function updateQuantity(itemId, change) {
            const item = cart.find(i => i.id === itemId);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.id !== itemId);
                }
                updateCartUI();
                renderMenu();
            }
        }

        function emptyCart() {
            cart = [];
            updateCartUI();
            renderMenu();
        }


        async function checkout() {
            if (cart.length === 0) return;

            let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            let discount = promoApplied ? promoDiscount : 0;
            let discountedTotal = Math.max(subtotal - discount, 0);
            let deliveryCharge = discountedTotal < 199 ? 20 : 0;
            let finalTotal = discountedTotal + deliveryCharge;

            // Simulate payment
            alert(`Payment successful!\nTotal Payable: ₹${finalTotal.toFixed(2)}\n\nYour order is being prepared.`);

            // Save order
            const order = {
                id: Date.now(),
                items: [...cart],
                total: finalTotal.toFixed(2),
                timestamp: new Date().toISOString(),
                status: 'preparing'
            };

            async function generateBillPDF(order) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                const margin = 20;
                let y = margin;

                doc.setFontSize(18);
                doc.text("FlavorCrate - Order Receipt", margin, y);
                y += 10;

                doc.setFontSize(12);
                doc.text(`Order ID: ${order.id}`, margin, y);
                doc.text(`Date: ${new Date(order.timestamp).toLocaleString()}`, margin, y + 7);
                y += 18;

                // Table Header
                doc.setFontSize(13);
                doc.setFont(undefined, 'bold');
                doc.text("Item", margin, y);
                doc.text("Qty", margin + 100, y);
                doc.text("Price", margin + 130, y);
                doc.setFont(undefined, 'normal');
                y += 8;

                // Divider
                doc.line(margin, y, 190 - margin, y);
                y += 5;

                order.items.forEach(item => {
                    doc.text(item.name, margin, y);
                    doc.text("INR " + (item.quantity), margin + 100, y);
                    // doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, margin + 130, y);
                    doc.text("INR " + (item.price * item.quantity).toFixed(2), margin + 130, y);
                    y += 8;
                });

                y += 5;
                doc.line(margin, y, 190 - margin, y);
                y += 10;

                // Summary Section
                const summary = [
                    ["Subtotal", "INR " + (order.subtotal).toFixed(2)],
                    ...(order.discount > 0 ? [["Discount", "INR -" + (order.discount).toFixed(2)]] : []),
                    ["Delivery", "INR " + (order.deliveryCharge).toFixed(2)],
                    ["Total", "INR " + (order.total)]
                ];

                summary.forEach(([label, value], i) => {
                    const isTotal = label === "Total";
                    if (isTotal) {
                        doc.setFont(undefined, 'bold');
                        doc.setFontSize(14);
                    } else {
                        doc.setFont(undefined, 'normal');
                        doc.setFontSize(12);
                    }

                    doc.text(label, margin, y);
                    doc.text(value, margin + 130, y);
                    y += isTotal ? 10 : 8;
                });

                y += 10;
                doc.setFontSize(10);
                doc.text("Thank you for ordering with FlavorCrate!", margin, y);

                doc.save(`FlavorCrate_Bill_${order.id}.pdf`);
            }

            await generateBillPDF({
                id: order.id,
                timestamp: order.timestamp,
                items: order.items,
                subtotal: subtotal,
                discount: discount,
                deliveryCharge: deliveryCharge,
                total: finalTotal.toFixed(2)
            });


            const orderHistory = JSON.parse(localStorage.getItem(`orderHistory_${currentUser.email}`) || '[]');
            orderHistory.unshift(order);
            localStorage.setItem(`orderHistory_${currentUser.email}`, JSON.stringify(orderHistory));

            // Start tracking
            currentOrder = order;
            startOrderTracking();

            // Clear cart
            emptyCart();
            // loadOrderHistory();
        }


        function loadOrderHistory() {
            const orderHistory = JSON.parse(localStorage.getItem(`orderHistory_${currentUser.email}`) || '[]');
            const container = document.getElementById('orderHistory');

            if (orderHistory.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">No orders yet</p>';
                return;
            }

            container.innerHTML = orderHistory.map(order => `
                <div class="border border-gray-200 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-semibold">Order #${order.id}</div>
                            <div class="text-sm text-gray-600">${new Date(order.timestamp).toLocaleString()}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-lg text-green-600">₹${order.total}</div>
                            <div class="text-sm px-2 py-1 rounded-full ${getStatusClass(order.status)}">
                                ${getStatusText(order.status)}
                            </div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        ${order.items.map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.name} x${item.quantity}</span>
                                <span>₹${item.price * item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        function getStatusClass(status) {
            const classes = {
                'preparing': 'bg-yellow-100 text-yellow-800',
                'on-route': 'bg-blue-100 text-blue-800',
                'delivered': 'bg-green-100 text-green-800'
            };
            return classes[status] || 'bg-gray-100 text-gray-800';
        }

        function getStatusText(status) {
            const texts = {
                'preparing': 'Preparing',
                'on-route': 'On Route',
                'delivered': 'Delivered'
            };
            return texts[status] || 'Unknown';
        }

        function startOrderTracking() {
            const trackingDiv = document.getElementById('orderTracking');
            const statusSpan = document.getElementById('trackingStatus');

            trackingDiv.classList.remove('hidden');

            // Simulate order progression
            setTimeout(() => {
                statusSpan.textContent = 'Order confirmed! Preparing your food...';
                currentOrder.status = 'preparing';
                updateOrderInHistory();
            }, 1000);

            setTimeout(() => {
                statusSpan.textContent = 'Food ready! Driver on the way...';
                currentOrder.status = 'on-route';
                updateOrderInHistory();
                startDeliveryAnimation();
            }, 5000);

            setTimeout(() => {
                statusSpan.textContent = 'Order delivered! Enjoy your meal!';
                currentOrder.status = 'delivered';
                updateOrderInHistory();
                trackingDiv.classList.add('hidden');
            }, 15000);
        }

        function updateOrderInHistory() {
            const orderHistory = JSON.parse(localStorage.getItem(`orderHistory_${currentUser.email}`) || '[]');
            const orderIndex = orderHistory.findIndex(o => o.id === currentOrder.id);
            if (orderIndex !== -1) {
                orderHistory[orderIndex] = currentOrder;
                localStorage.setItem(`orderHistory_${currentUser.email}`, JSON.stringify(orderHistory));
                loadOrderHistory();
            }
        }

        function startDeliveryAnimation() {
            if (!userMarker || !deliveryVehicle) return;

            const kitchenPos = kitchenMarker.getLatLng();
            const userPos = userMarker.getLatLng();

            // Animate delivery vehicle from kitchen to user
            let progress = 0;
            const animation = setInterval(() => {
                progress += 0.02;

                const lat = kitchenPos.lat + (userPos.lat - kitchenPos.lat) * progress;
                const lng = kitchenPos.lng + (userPos.lng - kitchenPos.lng) * progress;

                deliveryVehicle.setLatLng([lat, lng]);

                if (progress >= 1) {
                    clearInterval(animation);
                }
            }, 100);
        }

        async function initializeMap() {
            map = L.map('map').setView(kitchenLocation, 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add kitchen marker
            kitchenMarker = L.marker(kitchenLocation)
                .addTo(map)
                .bindPopup('🏪 FlavorCrate Kitchen')
                .openPopup();

            // Add delivery vehicle marker (initially at kitchen)
            deliveryVehicle = L.marker(kitchenLocation, {
                icon: L.divIcon({
                    html: '🚗',
                    iconSize: [30, 30],
                    className: 'delivery-vehicle'
                })
            }).addTo(map);

            // Geocode user address and add marker
            await geocodeAndAddUserMarker();
        }

        async function geocodeAndAddUserMarker() {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentUser.address)}&limit=1`);
                const data = await response.json();

                if (data.length > 0) {
                    const userLocation = [parseFloat(data[0].lat), parseFloat(data[0].lon)];

                    // Remove existing user marker if any
                    if (userMarker) {
                        map.removeLayer(userMarker);
                    }

                    // Add user marker
                    userMarker = L.marker(userLocation)
                        .addTo(map)
                        .bindPopup(`📍 Your Location<br>${currentUser.address}`);

                    // Draw route line
                    if (routeLine) {
                        map.removeLayer(routeLine);
                    }

                    routeLine = L.polyline([kitchenLocation, userLocation], {
                        color: '#f97316',
                        weight: 4,
                        opacity: 0.8,
                        className: 'route-line'
                    }).addTo(map);

                    // Fit map to show both markers
                    const group = new L.featureGroup([kitchenMarker, userMarker]);
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            } catch (error) {
                console.error('Geocoding error:', error);
            }
        }

        function setupEventListeners() {
            // Profile dropdown
            document.getElementById('profileBtn').addEventListener('click', function () {
                const dropdown = document.getElementById('profileDropdown');
                dropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function (e) {
                const profileBtn = document.getElementById('profileBtn');
                const dropdown = document.getElementById('profileDropdown');
                if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });

            // Address editing
            document.getElementById('editAddressBtn').addEventListener('click', function () {
                document.getElementById('newAddress').value = currentUser.address;
                document.getElementById('addressModal').classList.remove('hidden');
            });

            document.getElementById('saveAddressBtn').addEventListener('click', function () {
                const newAddress = document.getElementById('newAddress').value.trim();
                if (newAddress) {
                    currentUser.address = newAddress;

                    // Update localStorage
                    localStorage.setItem('flavorcrateUser', JSON.stringify(currentUser));

                    const users = JSON.parse(localStorage.getItem('flavorcrateUsers') || '[]');
                    const userIndex = users.findIndex(u => u.email === currentUser.email);
                    if (userIndex !== -1) {
                        users[userIndex] = currentUser;
                        localStorage.setItem('flavorcrateUsers', JSON.stringify(users));
                    }

                    // Update UI
                    document.getElementById('profileAddress').textContent = newAddress;
                    document.getElementById('addressModal').classList.add('hidden');

                    // Update map
                    geocodeAndAddUserMarker();
                }
            });

            document.getElementById('cancelAddressBtn').addEventListener('click', function () {
                document.getElementById('addressModal').classList.add('hidden');
            });

            // Logout
            document.getElementById('logoutBtn').addEventListener('click', function () {
                localStorage.removeItem('flavorcrateUser');
                window.location.href = 'login.html';
            });

            // Menu filters
            document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
            document.getElementById('filterVeg').addEventListener('click', () => setFilter('veg'));
            document.getElementById('filterNonVeg').addEventListener('click', () => setFilter('non-veg'));

            // Cart actions
            document.getElementById('checkoutBtn').addEventListener('click', checkout);
            document.getElementById('emptyCartBtn').addEventListener('click', emptyCart);
        }

        function setFilter(filter) {
            // Update button styles
            document.querySelectorAll('[id^="filter"]').forEach(btn => {
                btn.className = 'px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-medium transition hover:bg-gray-300';
            });

            const idMap = {
                'all': 'filterAll',
                'veg': 'filterVeg',
                'non-veg': 'filterNonVeg'
            };
            document.getElementById(idMap[filter]).className =
                'px-6 py-2 rounded-full bg-orange-500 text-white font-medium transition hover:bg-orange-600';

            renderMenu(filter);
        }

        // Global functions for onclick handlers
        window.addToCart = addToCart;
        window.updateQuantity = updateQuantity;



        const user = JSON.parse(localStorage.getItem('flavorcrateUser') || '{}');
        if (!user.email) location.href = 'login.html';

        let allOrders = [];
        let renderedCount = 0;
        const BATCH_SIZE = 5;

        function getStatusClass(status) {
            const classes = {
                'preparing': 'bg-yellow-100 text-yellow-800',
                'on-route': 'bg-blue-100 text-blue-800',
                'delivered': 'bg-green-100 text-green-800'
            };
            return classes[status] || 'bg-gray-100 text-gray-800';
        }

        function getStatusText(status) {
            const texts = {
                'preparing': 'Preparing',
                'on-route': 'On Route',
                'delivered': 'Delivered'
            };
            return texts[status] || 'Unknown';
        }

        function renderNextBatch() {
            const container = document.getElementById('orderHistory');
            const nextBatch = allOrders.slice(renderedCount, renderedCount + BATCH_SIZE);

            if (renderedCount === 0) {
                document.getElementById('orderCount').textContent = `Total Orders: ${allOrders.length}`;
            }

            if (nextBatch.length === 0 && renderedCount === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-6">No orders yet</p>';
                return;
            }

            const html = nextBatch.map(order => `
        <div class="border border-orange-100 bg-white rounded-lg shadow p-4 mb-4">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-semibold">Order #${order.id}</div>
              <div class="text-xs text-gray-500">${new Date(order.timestamp).toLocaleString()}</div>
            </div>
            <div class="text-right">
              <div class="text-green-600 font-bold text-sm">₹${order.total}</div>
              <div class="text-xs px-2 py-1 rounded ${getStatusClass(order.status)} mt-1 inline-block">
                ${getStatusText(order.status)}
              </div>
            </div>
          </div>
          <div class="text-sm text-gray-700 space-y-1">
            ${order.items.map(item => `
              <div class="flex justify-between">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${item.price * item.quantity}</span>
              </div>
            `).join('')}
          </div>
          <button onclick="downloadOrderPDF(${order.id})"
            class="mt-3 bg-orange-500 text-white text-xs px-3 py-1 rounded hover:bg-orange-600 transition">
            📄 Download Bill
          </button>
        </div>
      `).join('');

            container.insertAdjacentHTML('beforeend', html);
            renderedCount += nextBatch.length;
        }

        function handleScroll() {
            const loading = document.getElementById('loadingMsg');
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
                if (renderedCount < allOrders.length) {
                    loading.classList.remove('hidden');
                    setTimeout(() => {
                        renderNextBatch();
                        loading.classList.add('hidden');
                    }, 300);
                }
            }
        }

        function initOrderHistory() {
            allOrders = JSON.parse(localStorage.getItem(`orderHistory_${user.email}`) || '[]');
            renderNextBatch();
            window.addEventListener('scroll', handleScroll);
        }

        // Load user info
        document.getElementById('userName').textContent = user.username;
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profilePhone').textContent = user.phone;
        document.getElementById('profileAddress').textContent = user.address;

        // Profile dropdown toggle
        document.getElementById('profileBtn').addEventListener('click', function () {
            const dropdown = document.getElementById('profileDropdown');
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown on outside click
        document.addEventListener('click', function (e) {
            const profileBtn = document.getElementById('profileBtn');
            const dropdown = document.getElementById('profileDropdown');
            if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Edit address modal
        document.getElementById('editAddressBtn').addEventListener('click', function () {
            document.getElementById('newAddress').value = user.address;
            document.getElementById('addressModal').classList.remove('hidden');
        });

        document.getElementById('saveAddressBtn').addEventListener('click', function () {
            const newAddress = document.getElementById('newAddress').value.trim();
            if (newAddress) {
                user.address = newAddress;
                localStorage.setItem('flavorcrateUser', JSON.stringify(user));

                const users = JSON.parse(localStorage.getItem('flavorcrateUsers') || '[]');
                const userIndex = users.findIndex(u => u.email === user.email);
                if (userIndex !== -1) {
                    users[userIndex] = user;
                    localStorage.setItem('flavorcrateUsers', JSON.stringify(users));
                }

                document.getElementById('profileAddress').textContent = newAddress;
                document.getElementById('addressModal').classList.add('hidden');
            }
        });

        document.getElementById('cancelAddressBtn').addEventListener('click', function () {
            document.getElementById('addressModal').classList.add('hidden');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function () {
            localStorage.removeItem('flavorcrateUser');
            window.location.href = 'login.html';
        });

        async function downloadOrderPDF(orderId) {
            const { jsPDF } = window.jspdf;
            const order = allOrders.find(o => o.id === orderId);
            if (!order) return alert("Order not found");

            const doc = new jsPDF();
            let y = 20;
            const margin = 20;

            doc.setFontSize(16);
            doc.text("FlavorCrate - Order Invoice", margin, y);
            y += 10;

            doc.setFontSize(11);
            doc.text(`Order ID: ${order.id}`, margin, y);
            doc.text(`Date: ${new Date(order.timestamp).toLocaleString()}`, margin, y + 6);
            y += 16;

            doc.setFont(undefined, 'bold');
            doc.text("Item", margin, y);
            doc.text("Qty", margin + 90, y);
            doc.text("Total", margin + 130, y);
            doc.setFont(undefined, 'normal');
            y += 6;
            doc.line(margin, y, 190 - margin, y);
            y += 4;

            order.items.forEach(item => {
                doc.text(item.name, margin, y);
                doc.text(String(item.quantity), margin + 90, y);
                doc.text("INR " + (item.price * item.quantity).toFixed(2), margin + 130, y);
                y += 8;
            });

            y += 4;
            doc.line(margin, y, 190 - margin, y);
            y += 10;

            let subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            let discount = order.discount || 0;
            let discountedTotal = Math.max(subtotal - discount, 0);
            let delivery = order.deliveryCharge !== undefined ? order.deliveryCharge : (discountedTotal < 199 ? 20 : 0);
            let total = parseFloat(order.total);

            const summary = [
                ["Subtotal", "INR " + subtotal.toFixed(2)],
                ...(discount > 0 ? [["Discount", "INR -" + discount.toFixed(2)]] : []),
                ["Delivery", "INR " + delivery.toFixed(2)],
                ["Total", "INR " + total.toFixed(2)],
            ];

            summary.forEach(([label, val]) => {
                doc.text(label, margin, y);
                doc.text(val, margin + 130, y);
                y += 8;
            });

            y += 8;
            doc.setFontSize(10);
            doc.text("Thank you for ordering with FlavorCrate!", margin, y);

            doc.save(`FlavorCrate_Order_${order.id}.pdf`);
        }

        initOrderHistory();