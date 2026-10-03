import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { getDashboard } from '../../api/dashboardApi';
import { errorMessage } from '../../api/client';

const ROLE_LABELS = { student: 'Student', faculty: 'Faculty', admin: 'Administrator', doctor: 'College doctor' };

// the lines under the name: what identifies this user in the college
const detailsOf = (user) => {
    if (user.role === 'student') {
        return [
            ['Department', user.department],
            ['Class', [user.currentYear, user.classDivision].filter(Boolean).join(' · ')],
            ['Roll number', user.rollNumber],
        ];
    }

    if (user.role === 'faculty') {
        const coordinator = user.coordinatorOf?.department
            ? `${user.coordinatorOf.department} ${user.coordinatorOf.year} ${user.coordinatorOf.division}`
            : '';

        return [
            ['Department', user.department],
            ['Designation', user.designation],
            ['Board member', user.isBoardMember ? 'Yes' : ''],
            ['Coordinator of', coordinator],
        ];
    }

    return [];
};

// The dashboard: who is logged in and the figures that concern them
const Home = () => {
    const user = useSelector(state => state.auth.userData);
    const [cards, setCards] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        getDashboard()
            .then((data) => { if (!cancelled) setCards(data.cards); })
            .catch((err) => { if (!cancelled) setError(errorMessage(err)); });

        return () => { cancelled = true; };
    }, []);

    const details = detailsOf(user).filter(([, value]) => value);

    return (
        <div className="min-h-screen bg-gray-50 w-full">
            {/* Hero Section with Profile */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 w-full">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-2/3">
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 break-words">
                            Welcome, {user.name}
                        </h1>
                        <p className="text-xl opacity-90 max-w-2xl mb-6">
                            {ROLE_LABELS[user.role]}{user.isDemo ? ' · demo account' : ''}
                        </p>
                        {details.length > 0 && (
                            <div className="text-lg opacity-80">
                                {details.map(([label, value]) => <p key={label}>{label}: {value}</p>)}
                            </div>
                        )}
                    </div>
                    <div className="md:w-1/3 flex justify-center mt-6 md:mt-0">
                        <div className="w-32 h-32 rounded-full bg-blue-400 flex items-center justify-center border-4 border-white shadow-lg">
                            <span className="text-4xl text-white">
                                {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Figures for this user */}
            <div className="w-full bg-white py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                        At a glance
                    </h2>

                    {error && <p role="alert" className="text-center text-red-600">{error}</p>}
                    {!error && cards === null && <p className="text-center text-gray-500">Loading…</p>}

                    {cards && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cards.map((card) => (
                                <Link key={card.key} to={card.link} className="block">
                                    {/* the page is light whatever the theme of the frame, so the card is too */}
                                    <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 h-full">
                                        <CardContent className="p-6">
                                            <p className="text-4xl font-bold text-blue-700">{card.value}</p>
                                            <h3 className="text-lg font-semibold mt-2 text-gray-800">
                                                {card.label}
                                            </h3>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* What the system is for */}
            <div className="w-full bg-white pb-16">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <Shield className="w-16 h-16 text-blue-600 hidden md:block" />
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    Decisions in the open
                                </h3>
                                <p className="text-gray-600 max-w-2xl">
                                    Elections, complaints, bookings, applications and budgets are handled here so that
                                    everyone can see what was decided and by whom. The modules appear in the menu as
                                    they are connected.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
