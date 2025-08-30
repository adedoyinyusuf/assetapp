// This file configures Prisma's built-in seeding
module.exports = {
  seed: async (prisma) => {
    // Import the seed function from our main seed file
    const { main } = await import('./seed.mjs');
    return main(prisma);
  },
};
