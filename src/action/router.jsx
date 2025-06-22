import { createHashRouter, Navigate } from "react-router-dom";
import {RootLayout} from './layout/RootLayout'
import {Main} from './pages/Main/Main'
import {Location} from './pages/Location/Location'
import {History} from './pages/History/History'
import {Shifts} from './pages/Shifts/Shifts'
import {Settings} from './pages/Settings/Settings'

export const router = createHashRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <h1>Routing Error</h1>,
        children: [
            {
                index: true,
                element: <Navigate to="main" />
            },
            {
                path: 'main',
                element: <Main />
            },
            {
                path: 'location',
                element: <Location />
            },
            {
                path: 'shifts',
                element: <Shifts />
            },
            {
                path: 'settings',
                element: <Settings />
            },
            {
                path: 'history',
                element: <History />
            },
        ]
    },
    {
        path: '*',
        element: <h1>Wrong path</h1>
    }
]);