<template>
  <div class="app-container">
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
import { supabase } from './supabase'
import AppHeader from './components/AppHeader.vue'
import LoginView from './views/LoginView.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import FacultyDashboard from './views/FacultyDashboard.vue'

const user = ref(null)
const profile = ref(null)

const fetchUser = async () => {
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
}

onMounted(fetchUser)
</script>