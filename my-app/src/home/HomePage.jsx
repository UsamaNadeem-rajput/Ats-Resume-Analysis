import React from 'react'
import { Link, Links } from 'react-router-dom'

export default function HomePage() {
  return (
    <div>
        <h1>Home Page</h1>

        <Link to='/login' > Login </Link>
        <Link to='/register'>Register</Link>

    </div>
  )
}
