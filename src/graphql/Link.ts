import { extendType, objectType, nonNull, stringArg, intArg, inputObjectType, enumType, list, arg } from "nexus";
import { Prisma } from "@prisma/client";


export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderByInput", 
    definition(t) {
        t.field("description", { type: sort });
        t.field("url", { type: sort });
        t.field("createdAt", { type: sort });
    }
})


export const sort = enumType({
    name: "Sort", 
    members: ["asc", "desc"]
})




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





export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("feed", {  // 1
            type: "Feed",
            args: {
                filter: stringArg(),
                skip: intArg(),
                take: intArg(),
                orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }), 
            },
            async resolve(parent, args, context) {  
                const where = args.filter
                    ? {
                          OR: [
                              { description: { contains: args.filter } },
                              { url: { contains: args.filter } },
                          ],
                      }
                    : {};

                const links = await context.prisma.link.findMany({  
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as
                        | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
                        | undefined,
                });

                const count = await context.prisma.link.count({ where });  // 2
                const id = `main-feed:${JSON.stringify(args)}`;  // 3
                  
                return {  // 4
                    links,
                    count,
                    id,
                };
            },
        });
    },
});



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


export const Feed = objectType({
    name: "Feed", 
    definition(t) {
        t.nonNull.list.nonNull.field("links", { type: Link })
        t.nonNull.int("count")
        t.id("id")
    }
})