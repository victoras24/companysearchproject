import { useEffect } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, ArrowRight, FileText, Loader2 } from "lucide-react";
import { observer } from "mobx-react";
import { useCartStore } from "@/context/CartStore";
import { checkout, formatPrice } from "@/checkout";

const Cart = observer(() => {
	const cartStore = useCartStore();

	useEffect(() => checkout.loadPrice(), []);

	const { price, state } = checkout;
	const reports = cartStore.cartItems.length;
	const pending = state.status === "pending";

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Shopping Cart</h1>
				<Badge variant="outline" className="p-2">
					<ShoppingCart className="h-4 w-4 mr-2" />
					{cartStore.cartItems.length}{" "}
					{cartStore.cartItems.length === 1 ? "report" : "reports"}
				</Badge>
			</div>

			{cartStore.cartItems.length === 0 ? (
				<Card className="text-center p-12">
					<CardContent>
						<div className="flex flex-col items-center gap-4">
							<ShoppingCart className="h-16 w-16 text-gray-300" />
							<h2 className="text-2xl font-medium">Your cart is empty</h2>
							<p className="text-gray-500">
								Looks like you haven't added any reports to your cart yet.
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle>Reports</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{cartStore.cartItems.map((item) => (
										<div key={`${item.organisationTypeCode}/${item.registrationNo}`}>
											<div className="flex items-center gap-4">
												<div className="h-24 w-24 overflow-hidden rounded-md">
													<FileText className="h-full w-full object-cover" />
												</div>

												<div className="flex-1">
													<div className="flex justify-between">
														<h3 className="font-medium">{item.organisationName}</h3>
													</div>
													{price && (
														<p className="text-sm text-gray-500 mt-1">
															{formatPrice(price)}
														</p>
													)}

													<div className="flex items-center gap-4 mt-4">
														<Button
															variant="ghost"
															size="sm"
															className="text-red-500 hover:text-red-700 hover:bg-red-50"
															onClick={() => cartStore.removeItem(item)}
														>
															<Trash2 className="h-4 w-4 mr-1" /> Remove
														</Button>
													</div>
												</div>
											</div>
											<Separator className="my-6" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<div>
						<Card>
							<CardHeader>
								<CardTitle>Order Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between">
									<span>Quantity</span>
									<span>{reports}</span>
								</div>

								{price && (
									<>
										<div className="flex justify-between">
											<span>Subtotal</span>
											<span>{formatPrice(price, reports)}</span>
										</div>

										<Separator />

										<div className="flex justify-between font-semibold text-lg">
											<span>Total</span>
											<span>{formatPrice(price, reports)}</span>
										</div>
									</>
								)}
							</CardContent>
							<CardFooter className="flex-col gap-3">
								<Button
									className="w-full"
									size="lg"
									disabled={pending}
									onClick={() => checkout.checkOut(cartStore.cartItems)}
								>
									{pending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting
											checkout...
										</>
									) : (
										<>
											Checkout <ArrowRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
								{state.status === "failed" && (
									<p role="alert" className="text-sm text-red-600">
										{state.message}
									</p>
								)}
							</CardFooter>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
});

export default Cart;
