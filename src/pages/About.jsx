import React from 'react'

export default function About() {
  return (
    <div className="px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">About TubeBee</h1>
        <div className="rounded-2xl border border-white/40 bg-white/50 backdrop-blur p-6 shadow">
          <p className="text-slate-800">
            TubeBee is a modern, glassy YouTube downloader that focuses on speed and simplicity.
            It can download videos and create MP3s directly from the audio stream for faster results.
          </p>
          <ul className="mt-4 list-disc pl-5 space-y-1 text-slate-700">
            <li>Direct MP3 conversion (no temporary large files)</li>
            <li>Clean UI with creamy white theme and subtle animations</li>
            <li>Works locally; files saved in your downloads folder</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


