import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://kteccplzqdqymrhhyxsw.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZWNjcGx6cWRxeW1yaGh5eHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzYwNjUsImV4cCI6MjA1OTExMjA2NX0.e7jX8X1EhPYrMHWNbF2XFFkxD7oDhjh7lfrD7b0W4cI"

// Create Supabase client with better configuration
export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
  global: {
    headers: {
      "X-Client-Info": "tevat-hateamim",
    },
  },
})

// Helper function to check bucket existence
export const checkAndCreateBucket = async (bucketName: string) => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabaseClient.storage.listBuckets()

    if (error) {
      console.error("Error checking buckets:", error)
      return false
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, creating...`)
      // Create bucket if it doesn't exist
      const { error: createError } = await supabaseClient.storage.createBucket(bucketName, {
        public: true,
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return false
      }

      console.log(`Bucket ${bucketName} created successfully`)
    } else {
      console.log(`Bucket ${bucketName} already exists`)
    }

    return true
  } catch (error) {
    console.error("Error in bucket check/create:", error)
    return false
  }
}

