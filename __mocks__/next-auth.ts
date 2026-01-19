
// Generic NextAuth mock for all tests
const getServerSession = jest.fn().mockImplementation(() => {
    // Try to find the headers from the test-client global
    const headers = (global as any).__CURRENT_REQUEST_HEADERS || {};

    // Try various casing
    const authKey = Object.keys(headers).find(key => key.toLowerCase() === 'authorization');
    const auth = authKey ? headers[authKey] : undefined;

    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
        const id = auth.split(' ')[1];
        return Promise.resolve({
            user: { id }
        });
    }
    return Promise.resolve(null);
});

module.exports = {
    getServerSession,
    default: { getServerSession }
};
