<!-- <script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style> -->
<template>
  <div class="app">
    <header>
      <h1>Vue + Supabase — Simple App</h1>
      <div v-if="session">
        <span>{{ user.email }}</span>
        <button @click="signOut">Sign out</button>
      </div>
    </header>

    <main>
      <section v-if="!session" class="auth">
        <h2>Sign in / Sign up</h2>
        <form @submit.prevent="handleAuth">
          <input v-model="authEmail" type="email" placeholder="Email" required />
          <input v-model="authPassword" type="password" placeholder="Password" required />
          <button type="submit">Sign in / Sign up</button>
        </form>
        <p v-if="authMessage">{{ authMessage }}</p>
      </section>

      <section v-else class="dashboard">
        <h2>Profile</h2>
        <div class="profile">
          <div v-if="profile.avatar_url">
            <img :src="profile.avatar_url" alt="avatar" class="avatar" />
          </div>
          <div>
            <div v-if="!editing">
              <p><strong>Name:</strong> {{ profile.full_name || '—' }}</p>
              <p><strong>Bio:</strong> {{ profile.bio || '—' }}</p>
              <button @click="editing = true">Edit</button>
            </div>
            <div v-else>
              <input v-model="form.full_name" placeholder="Full name" />
              <textarea v-model="form.bio" placeholder="Bio"></textarea>
              <button @click="saveProfile">Save</button>
              <button @click="cancelEdit">Cancel</button>
            </div>
          </div>
        </div>

        <hr />

        <h2>Media Upload</h2>
        <input type="file" @change="onFileChange" accept="image/*" />
        <button @click="uploadFile" :disabled="!selectedFile">Upload</button>
        <p v-if="uploadMessage">{{ uploadMessage }}</p>

        <h3>Your uploads</h3>
        <div class="uploads">
          <div v-if="files.length === 0">No uploads yet.</div>
          <ul>
            <li v-for="f in files" :key="f.id">
              <img :src="f.publicURL" alt="file" class="thumb" />
              <div class="meta">
                <div>{{ f.name }}</div>
                <div>{{ (f.size/1024).toFixed(1) }} KB</div>
                <button @click="deleteFile(f)">Delete</button>
              </div>
            </li>
          </ul>
        </div>

        <hr />

        <button class="danger" @click="deleteAccount">Delete account & data</button>
      </section>
    </main>

    <footer>
      <small>Built with Vue 3 + Supabase</small>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase, getProfile, upsertProfile } from './supabase'

const session = ref(null)
const user = ref(null)

const authEmail = ref('')
const authPassword = ref('')
const authMessage = ref('')

const profile = reactive({ full_name: '', bio: '', avatar_url: '', email: '' })
const form = reactive({ full_name: '', bio: '' })
const editing = ref(false)

const selectedFile = ref(null)
const files = ref([])
const uploadMessage = ref('')

onMounted(async () => {
  const { data: { session: s } } = await supabase.auth.getSession()
  session.value = s
  if (s) {
    user.value = s.user
    await loadProfile()
    await loadFiles()
  }

  supabase.auth.onAuthStateChange((event, _session) => {
    session.value = _session
    user.value = _session?.user ?? null
    if (_session) loadProfile()
    else {
      Object.assign(profile, { full_name: '', bio: '', avatar_url: '', email: '' })
      files.value = []
    }
  })
})

async function handleAuth() {
  authMessage.value = ''
  try {
    // try sign in first
    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail.value,
      password: authPassword.value
    })
    if (signInError) {
      // if sign in failed, sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email: authEmail.value,
        password: authPassword.value
      })
      if (signUpError) throw signUpError
      authMessage.value = 'Check your email to confirm signup (if required by your Supabase settings).'
    } else {
      authMessage.value = 'Signed in.'
    }
  } catch (err) {
    authMessage.value = err.message || JSON.stringify(err)
  }
}

async function signOut() {
  await supabase.auth.signOut()
}

async function loadProfile() {
  if (!user.value) return
  try {
    const p = await getProfile(user.value.id)
    if (p) {
      profile.full_name = p.full_name
      profile.bio = p.bio
      profile.avatar_url = p.avatar_url
      profile.email = p.email || user.value.email
      form.full_name = p.full_name || ''
      form.bio = p.bio || ''
    } else {
      // create initial profile entry
      await upsertProfile({ id: user.value.id, email: user.value.email })
      profile.email = user.value.email
    }
  } catch (err) {
    console.error('profile load error', err)
  }
}

function cancelEdit() {
  editing.value = false
  form.full_name = profile.full_name
  form.bio = profile.bio
}

async function saveProfile() {
  if (!user.value) return
  try {
    await upsertProfile({ id: user.value.id, email: user.value.email, full_name: form.full_name, bio: form.bio })
    profile.full_name = form.full_name
    profile.bio = form.bio
    editing.value = false
  } catch (err) {
    console.error(err)
  }
}

function onFileChange(e) {
  selectedFile.value = e.target.files[0]
}

async function uploadFile() {
  if (!selectedFile.value || !user.value) return
  uploadMessage.value = 'Uploading...'
  try {
    const file = selectedFile.value
    const filename = `${user.value.id}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('uploads').upload(filename, file)
    if (error) throw error

    // get public URL (or signed URL if bucket is private)
    const { data: publicURLData } = supabase.storage.from('uploads').getPublicUrl(data.path)
    // Save a simple record in profiles.avatar_url (optional) or you can maintain a separate metadata table
    profile.avatar_url = publicURLData.publicUrl

    // update profile with avatar_url
    await upsertProfile({ id: user.value.id, avatar_url: profile.avatar_url, email: user.value.email })

    uploadMessage.value = 'Uploaded.'
    selectedFile.value = null
    await loadFiles()
  } catch (err) {
    uploadMessage.value = err.message || JSON.stringify(err)
  }
}

async function loadFiles() {
  if (!user.value) return
  try {
    const prefix = `${user.value.id}/`
    const { data: list, error } = await supabase.storage.from('uploads').list(prefix)
    if (error) throw error
    // build public URLs
    const enriched = await Promise.all(list.map(async (item) => {
      const { data } = supabase.storage.from('uploads').getPublicUrl(item.name)
      return {
        id: item.id || item.name,
        name: item.name.split('/').pop(),
        path: item.name,
        size: item.size || 0,
        publicURL: data.publicUrl
      }
    }))
    files.value = enriched
  } catch (err) {
    console.error('load files error', err)
  }
}

async function deleteFile(f) {
  if (!confirm('Delete this file?')) return
  try {
    const { error } = await supabase.storage.from('uploads').remove([f.path])
    if (error) throw error
    await loadFiles()
  } catch (err) {
    console.error(err)
  }
}

async function deleteAccount() {
  if (!confirm('This will delete your account and profile. Proceed?')) return
  try {
    // delete profile row
    await supabase.from('profiles').delete().eq('id', user.value.id)
    // delete files
    const prefix = `${user.value.id}/`
    const { data: list } = await supabase.storage.from('uploads').list(prefix)
    if (list && list.length) {
      const paths = list.map(i => i.name)
      await supabase.storage.from('uploads').remove(paths)
    }
    // delete user via admin: Supabase JS in client cannot delete auth.users — this requires a server-side admin key.
    // As a client, we can sign the user out and prompt them to delete manually in dashboard or call a server endpoint.
    await supabase.auth.signOut()
    alert('Profile & uploads deleted locally. To fully delete the auth user, call a server endpoint with Supabase Admin key or delete from the Supabase Auth dashboard.')
  } catch (err) {
    console.error(err)
  }
}
</script>

<style>
:root{font-family:system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial}
.app{max-width:900px;margin:20px auto;padding:10px}
header{display:flex;justify-content:space-between;align-items:center}
header h1{margin:0}
.auth input, .profile input, textarea{display:block;margin:6px 0;padding:8px;width:100%;max-width:420px}
.avatar{width:120px;height:120px;object-fit:cover;border-radius:8px}
.uploads ul{list-style:none;padding:0}
.uploads li{display:flex;align-items:center;margin:8px 0}
.thumb{width:80px;height:80px;object-fit:cover;border-radius:6px;margin-right:10px}
.meta{display:flex;flex-direction:column}
button{padding:6px 10px;margin:4px}
button.danger{background:#ffdddd;border:1px solid #ff7777}
</style>
