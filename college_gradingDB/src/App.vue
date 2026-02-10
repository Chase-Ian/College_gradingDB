<template>
  <div v-if="appLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="logo-box mb-4">RAMS</div>
      <p class="text-gray-500 animate-pulse">Initializing session...</p>
    </div>
  </div>

  <div v-else class="app-container">
    <LoginView v-if="!user" @login-success="fetchUser" />

    <div v-else class="dashboard-layout">
      <AppHeader :profile="profile" />
      
      <main class="content">
        <AdminDashboard v-if="profile?.role === 'admin'" />
        <FacultyDashboard v-else />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './components/supabase'
import AppHeader from './components/AppHeader.vue'
import LoginView from './views/LoginView.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import FacultyDashboard from './views/FacultyDashboard.vue'

const user = ref(null)
const profile = ref(null)
const appLoading = ref(true) // 1. ADD THIS REF

const fetchUser = async () => {
  appLoading.value = true // 2. SET TO TRUE AT START
  const { data } = await supabase.auth.getUser()
  user.value = data.user
  
  if (data.user) {
    const { data: p } = await supabase
      .from('Profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    profile.value = p
  }
  appLoading.value = false // 3. SET TO FALSE AT END
}

onMounted(fetchUser)
</script>