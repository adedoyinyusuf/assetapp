import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";


export default function DesignSystemPage() {
    return (
        <div className="container py-10 space-y-10">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
                <p className="text-muted-foreground">
                    A showcase of the design tokens and components used in the application.
                </p>
            </div>

            <hr className="my-6" />

            {/* Typography Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Typography</h2>
                <div className="grid gap-4 p-6 border rounded-lg">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
                        <p className="text-sm text-muted-foreground">text-4xl font-extrabold tracking-tight lg:text-5xl</p>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-semibold tracking-tight first:mt-0">Heading 2</h2>
                        <p className="text-sm text-muted-foreground">text-3xl font-semibold tracking-tight</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
                        <p className="text-sm text-muted-foreground">text-2xl font-semibold tracking-tight</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
                        <p className="text-sm text-muted-foreground">text-xl font-semibold tracking-tight</p>
                    </div>
                    <div className="space-y-1">
                        <p className="leading-7 [&:not(:first-child)]:mt-6">
                            The quick brown fox jumps over the lazy dog. This is a standard paragraph element with leading-7.
                        </p>
                        <p className="text-sm text-muted-foreground">body / p</p>
                    </div>
                    <div className="space-y-1">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                            const variable = "value";
                        </code>
                        <p className="text-sm text-muted-foreground">inline code</p>
                    </div>
                </div>
            </section>

            <hr className="my-6" />

            {/* Colors Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Colors</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorCard name="Primary" className="bg-primary text-primary-foreground" />
                    <ColorCard name="Secondary" className="bg-secondary text-secondary-foreground" />
                    <ColorCard name="Destructive" className="bg-destructive text-destructive-foreground" />
                    <ColorCard name="Muted" className="bg-muted text-muted-foreground" />
                    <ColorCard name="Accent" className="bg-accent text-accent-foreground" />
                    <ColorCard name="Card" className="bg-card text-card-foreground border" />
                    <ColorCard name="Popover" className="bg-popover text-popover-foreground border" />
                    <ColorCard name="Background" className="bg-background text-foreground border" />
                </div>
            </section>

            <hr className="my-6" />

            {/* Components Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Components</h2>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Buttons */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Buttons</CardTitle>
                            <CardDescription>Button variants and sizes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="link">Link</Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm">Small</Button>
                                <Button size="default">Default</Button>
                                <Button size="lg">Large</Button>
                                <Button size="icon">icon</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inputs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Inputs</CardTitle>
                            <CardDescription>Input fields and states.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input type="email" placeholder="Email" />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input disabled type="email" placeholder="Disabled" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cards */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Card Component</CardTitle>
                            <CardDescription>This is a card description.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Card content goes here. It can contain any other components.</p>
                        </CardContent>
                        <CardFooter>
                            <p className="text-sm text-muted-foreground">Card Footer</p>
                        </CardFooter>
                    </Card>
                </div>
            </section>
        </div>
    );
}

function ColorCard({ name, className }: { name: string; className: string }) {
    return (
        <div className={`p-4 rounded-lg flex items-center justify-center h-24 shadow-sm ${className}`}>
            <span className="font-semibold">{name}</span>
        </div>
    );
}
