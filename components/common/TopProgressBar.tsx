'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.2,
})

export default function TopProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        NProgress.done()
    }, [pathname, searchParams])

    useEffect(() => {
        const style = document.createElement('style')
        style.innerHTML = `
            #nprogress .bar {
                background: #14b8a6 !important;
                height: 3px !important;
            }
            #nprogress .peg {
                box-shadow: 0 0 10px #14b8a6, 0 0 5px #14b8a6 !important;
            }
        `
        document.head.appendChild(style)

        return () => {
            document.head.removeChild(style)
        }
    }, [])

    return null
}
