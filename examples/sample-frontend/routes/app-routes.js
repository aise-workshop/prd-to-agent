// Frontend routing configuration for React/Vue-like applications
export const routes = [
  {
    path: '/',
    component: 'HomePage',
    name: 'home',
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    component: 'LoginPage', 
    name: 'login',
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    component: 'RegisterPage',
    name: 'register', 
    meta: { requiresAuth: false }
  },
  {
    path: '/products',
    component: 'ProductsPage',
    name: 'products',
    meta: { requiresAuth: false }
  },
  {
    path: '/product/:id',
    component: 'ProductDetailPage',
    name: 'product-detail',
    meta: { requiresAuth: false }
  },
  {
    path: '/cart',
    component: 'CartPage',
    name: 'cart',
    meta: { requiresAuth: false }
  },
  {
    path: '/checkout',
    component: 'CheckoutPage',
    name: 'checkout',
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    component: 'ProfilePage',
    name: 'profile',
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    component: 'OrdersPage',
    name: 'orders',
    meta: { requiresAuth: true }
  }
];

export const authRoutes = routes.filter(route => route.meta.requiresAuth);
export const publicRoutes = routes.filter(route => !route.meta.requiresAuth);