const ADJECTIVES = [
    'Swift', 'Silent', 'Clever', 'Brave', 'Mighty',
    'Sneaky', 'Happy', 'Wild', 'Cosmic', 'Neon',
    'Frosty', 'Lucky', 'Pixel', 'Turbo', 'Shadow'
];

const ANIMALS = [
    'Tiger', 'Eagle', 'Dolphin', 'Wolf', 'Panda',
    'Falcon', 'Bear', 'Fox', 'Dragon', 'Shark',
    'Raven', 'Cobra', 'Panther', 'Rhino', 'Owl'
];

export default function generateUsername() {
    const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900);

    return `${randomAdj}${randomAnimal}${randomNumber}`;
}
