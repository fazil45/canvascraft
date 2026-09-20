import { PenTool } from 'lucide-react'
import React from 'react'

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-white/5">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-linear-to-br from-emerald-400 to-teal-600">
                  <PenTool
                    className="h-3.5 w-3.5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                Sketchboard
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Built with realtime Supabase
              </p>
            </div>
          </footer>
  )
}

export default Footer