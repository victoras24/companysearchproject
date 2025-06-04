import { useState } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, ArrowRight, FileText } from "lucide-react";
import { observer } from "mobx-react";
import { useCartStore } from "@/context/CartStore";
import { CheckoutFormModel } from "../CheckoutForm/CheckoutForm_model";

const Cart = observer(() => {
	const [checkoutModel] = useState(() => new CheckoutFormModel());
	const cartStore = useCartStore();
	const [discountCode, setDiscountCode] = useState("");
	const [discountApplied, setDiscountApplied] = useState(false);

	const applyDiscount = () => {
		if (discountCode.trim().toLowerCase() === "welcome20") {
			setDiscountApplied(true);
		}
	};

	const total = discountApplied
		? cartStore.subtotal() * 0.8
		: cartStore.subtotal();

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
										<div key={item.id}>
											<div className="flex items-center gap-4">
												<div className="h-24 w-24 overflow-hidden rounded-md">
													<FileText className="h-full w-full object-cover" />
												</div>

												<div className="flex-1">
													<div className="flex justify-between">
														<h3 className="font-medium">{item.name}</h3>
													</div>
													<p className="text-sm text-gray-500 mt-1">
														€{item.price.toFixed(2)}
													</p>

													<div className="flex items-center gap-4 mt-4">
														<Button
															variant="ghost"
															size="sm"
															className="text-red-500 hover:text-red-700 hover:bg-red-50"
															onClick={() => cartStore.removeItem(item.id)}
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
									<span>{cartStore.cartItems.length}</span>
								</div>

								<div className="flex justify-between">
									<span>Subtotal</span>
									<span>€{cartStore.subtotal().toFixed(2)}</span>
								</div>

								<div className="flex gap-2">
									<Input
										placeholder="Discount code"
										value={discountCode}
										onChange={(e) => setDiscountCode(e.target.value)}
									/>
									<Button
										variant="outline"
										onClick={applyDiscount}
										disabled={discountApplied}
									>
										Apply
									</Button>
								</div>

								{discountApplied && (
									<div className="flex justify-between text-green-600">
										<span>Discount (20%)</span>
										<span>-€{(cartStore.subtotal() * 0.2).toFixed(2)}</span>
									</div>
								)}

								<Separator />

								<div className="flex justify-between font-semibold text-lg">
									<span>Total</span>
									<span>€{total.toFixed(2)}</span>
								</div>
							</CardContent>
							<CardFooter>
								<Button
									className="w-full"
									size="lg"
									onClick={async () => {
										const totalAmount = total;
										const quantity = cartStore.cartItems.length;
										const res = await checkoutModel.createCheckoutSession(
											totalAmount,
											quantity
										);
										if (res.url) {
											window.location.href = res.url;
										}
									}}
								>
									Checkout <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
});

export default Cart;
