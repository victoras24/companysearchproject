import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, Mail, FileText } from "lucide-react";
import { returningSession } from "@/checkout";
import { useCartStore } from "@/context/CartStore";

const ReturnForm = observer(() => {
	const cartStore = useCartStore();
	const [session] = useState(() => returningSession(cartStore.clearCart));

	useEffect(() => {
		session.resolve(window.location.search);
		return () => session.dispose();
	}, [session]);

	const navigate = (path: string) => {
		window.location.href = path;
	};

	const state = session.state;

	if (state.status === "confirming") {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center max-w-md">
					{state.takingLong ? (
						<>
							<Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
							<p className="text-slate-600 mb-6">
								Your payment is still being confirmed. Your invoice will follow
								by email.
							</p>
							<button
								onClick={() => navigate("/")}
								className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Return to Home
							</button>
						</>
					) : (
						<>
							<RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
							<p className="text-slate-600">Confirming your payment...</p>
						</>
					)}
				</div>
			</div>
		);
	}

	if (state.status === "paid") {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="max-w-md w-full">
					<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
						<div className="mb-6">
							<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
							<h1 className="text-2xl font-bold text-slate-900 mb-2">
								Payment successful
							</h1>
							<p className="text-slate-600">We've received your order.</p>
						</div>

						{state.items.length > 0 && (
							<ul className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2 text-left">
								{state.items.map((item) => (
									<li
										key={`${item.organisationTypeCode}/${item.registrationNo}`}
										className="flex items-start text-sm text-slate-700"
									>
										<FileText className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
										{item.organisationName}
									</li>
								))}
							</ul>
						)}

						<div className="space-y-3">
							<div className="flex items-center justify-center text-sm text-slate-600">
								<Mail className="h-4 w-4 mr-2" />
								Your invoice is on its way by email
							</div>

							<button
								onClick={() => navigate("/")}
								className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Return to Home
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (state.status === "canceled") {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="max-w-md w-full">
					<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
						<div className="mb-6">
							<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
								<XCircle className="h-8 w-8 text-red-600" />
							</div>
							<h1 className="text-2xl font-bold text-slate-900 mb-2">
								Payment Canceled
							</h1>
							<p className="text-slate-600">
								Your payment was canceled. No charges were made to your account.
							</p>
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
							<p className="text-sm text-amber-800">
								Your items are still in your cart and ready for checkout
								whenever you're ready.
							</p>
						</div>

						<div className="space-y-3">
							<button
								onClick={() => navigate("/cart")}
								className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
							>
								Try Again
							</button>

							<button
								onClick={() => navigate("/")}
								className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Continue
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
					<div className="mb-6">
						<div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
							<RefreshCw className="h-6 w-6 text-slate-600" />
						</div>
						<h1 className="text-2xl font-bold text-slate-900 mb-2">
							Something went wrong
						</h1>
						<p className="text-slate-600">
							We couldn't determine your payment status. Please contact support
							if you need assistance.
						</p>
					</div>

					<button
						onClick={() => navigate("/")}
						className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Return to Home
					</button>
				</div>
			</div>
		</div>
	);
});

export default ReturnForm;
