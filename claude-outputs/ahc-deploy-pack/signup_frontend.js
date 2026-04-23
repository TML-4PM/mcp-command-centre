// AHC signup — correct pattern. Trigger populates public.profiles automatically.
// DO NOT manually insert into profiles from the client.

export async function signUp({ supabase, email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,   // optional — trigger will fall back to email if absent
        role: 'user'           // optional — defaults to 'user'
      }
    }
  });
  if (error) throw error;
  return data;  // data.user.id is the new profile id
}
