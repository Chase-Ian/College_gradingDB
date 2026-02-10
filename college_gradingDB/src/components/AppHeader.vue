<template>
  <header class="header-main">
    <div class="header-container">
      <div class="header-brand">
        <div class="logo-box">RAMS</div>
        <div class="brand-text">
          <h1 class="school-name">Asia Pacific College</h1>
          <p class="portal-tag">Academic Management System</p>
        </div>
      </div>

      <div v-if="profile" class="header-user">
        <div class="user-details">
          <p class="user-name">{{ profile.full_name }}</p>
          <p class="user-email">{{ profile.email }}</p>
        </div>

        <span 
          :class="profile.role === 'admin' ? 'badge-admin' : 'badge-faculty'" 
          class="badge"
        >
          {{ profile.role }}
        </span>

        <button @click="handleLogout" class="btn-logout" title="Sign Out">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { supabase } from '../supabase'

// Receive the profile data from App.vue
defineProps({
  profile: Object
})

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (!error) {
    // Refresh the page to reset the app state
    window.location.reload()
  }
}
</script>

<style scoped>
.header-main {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 2rem;
  width: 100%;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  background: #1e3a8a;
  color: white;
  font-weight: 800;
  padding: 8px 12px;
  border-radius: 8px;
  letter-spacing: 1px;
}

.school-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.portal-tag {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-details {
  text-align: right;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.btn-logout {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>