import { extendType, objectType, nonNull, stringArg } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";



export const Link = objectType({
    name: "link", 
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('description'); 
        t.nonNull.string('url');
        t.nonNull.dateTime("createdAt")
        t.field('postedBy', {
            type: 'User', 
            resolve(parent, args, context) {
                return context.prisma.link.findUnique({where: { id: parent.id }}).postedBy()
            }
        })
        t.nonNull.list.nonNull.field("voters", {
            type: "User", 
            resolve(parent, args, context) {
                return context.prisma.link.findUnique({
                    where: { id: parent.id }
                }).voters()
            }
        })
    }
})



let links: NexusGenObjects["link"][] = [ 
    {
        id: 1,
        url: "www.howtographql.com",
        description: "Fullstack tutorial for GraphQL",
    },
    {
        id: 2,
        url: "graphql.org",
        description: "GraphQL official website",
    },
]


export const LinkQuery = extendType({
    type: 'Query', 
    definition(t) {
        t.nonNull.list.nonNull.field('feed', {
            type: 'link', 
            resolve(parent, args, context, info) {
                return context.prisma.link.findMany()
            }
        })
    }
})


export const linkMutation = extendType({
    type: 'Mutation', 
    definition(t) {
        t.nonNull.field('post', {
            type: 'link', 
            args: {
                description: nonNull(stringArg()), 
                url: nonNull(stringArg())
            }, 
            resolve(parent, args, context) {
                const { description, url } = args;
                const { userId } = context;

                if (!userId) {  // 1
                    throw new Error("Cannot post without logging in.");
                }

                const newLink = context.prisma.link.create({
                    data: {
                        description,
                        url,
                        postedBy: { connect: { id: userId } },  // 2
                    },
                });

                return newLink;

            }
        })
    }
})