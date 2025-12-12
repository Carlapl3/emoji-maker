'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function UserProfileInitializer() {
    const { isSignedIn } = useUser()

    useEffect(() => {
        if (isSignedIn) {
            fetch('/api/profile/init', {
                method: 'POST',
            }).catch(error => {
                console.error('Failed to initialize user profile:', error)
            })
        }
    }, [isSignedIn])

    return null
}