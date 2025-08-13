import React from 'react'

export default function Contact() {
  return (
    <div className="px-6 py-12">
      <div className="max-w-3xl mx-auto rounded-2xl border border-white/40 bg-white/50 backdrop-blur p-6 shadow space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="text-slate-700">Have feedback or a feature request? Send us a message.</p>
        <form className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-300/60" placeholder="Your name" />
          <input className="rounded-xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-300/60" placeholder="Email" />
          <textarea className="md:col-span-2 rounded-xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-300/60" rows="4" placeholder="Message" />
          <div>
            <button type="button" className="rounded-lg bg-amber-400 px-4 py-2 text-white hover:bg-amber-500 shadow">Send</button>
          </div>
        </form>
      </div>
    </div>
  )
}


