import prisma from "./config/prisma";
import bcrypt from "bcryptjs";
import {
    randUser,
    randPost,
    randImg,
    randTextRange,
    randPassword,
} from "@ngneat/falso";

const deleteAll = async () => {
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
};

const seed = async () => {
    // Create demo user first
    const demoUserPassword = await bcrypt.hash("Password@123", 10);
    const demoUser = await prisma.user.create({
        data: {
            username: "bobsmith",
            password: demoUserPassword,
            bio: "Demo user for testing the blog application.",
            avatar: "https://via.placeholder.com/150/0000FF/808080?text=Demo+User",
            fullName: "Bob Smith",
        },
    });
    
    const usersNumber = 49; // Reduced by 1 since we created the demo user
    const usersData = randUser({ length: usersNumber }).map((user) => ({
        username: user.username,
        password: randPassword(),
        bio: randTextRange({ min: 100, max: 120 }),
        avatar: user.img,
        fullName: `${user.firstName} ${user.lastName}`,
    }));
    await prisma.user.createMany({
        data: usersData,
    });
    const users = await prisma.user.findMany();

    const postsNumber = 100;
    const likesNumber = Math.floor(Math.random() * usersNumber);
    const posts = randPost({ length: postsNumber });
    for (let i = 0; i < postsNumber; i++) {
        const post = {
            title: posts[i].title.substring(0, 100),
            content: posts[i].body,
            preview: randTextRange({ min: 100, max: 120 }),
            postImg: randImg(),
            authorId: users[Math.floor(Math.random() * users.length)].id,
            likesNumber,
        };

        const likesData = [];
        for (let j = 0; j < likesNumber; j++) {
            likesData.push({
                userId: users[j].id,
            });
        }

        const commentsData = [];
        for (let j = 0; j < posts[i].comments.length; j++) {
            commentsData.push({
                content: posts[i].comments[j].text,
                authorId: users[j].id,
            });
        }

        await prisma.post.create({
            data: {
                ...post,
                updatedAt: new Date(),
                likes: {
                    create: likesData,
                },
                comments: {
                    create: commentsData,
                },
            },
        });
    }
};

deleteAll().then(() => seed());
