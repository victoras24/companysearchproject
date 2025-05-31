import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, Mail } from "lucide-react";

const ReturnForm = () => {
	const [loading, setLoading] = useState(true);

	const urlParams = new URLSearchParams(window.location.search);
	const isSuccess = urlParams.get("success") === "true";
	const isCanceled = urlParams.get("canceled") === "true";
	const sessionId = urlParams.get("session_id");

	const navigate = (path: string) => {
		window.location.href = path;
	};

	useEffect(() => {
		const timer = setTimeout(() => setLoading(false), 1000);
		return () => clearTimeout(timer);
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
					<p className="text-slate-600">Processing your payment...</p>
				</div>
			</div>
		);
	}

	if (isSuccess) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="max-w-md w-full">
					<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
						<div className="mb-6">
							<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
							<h1 className="text-2xl font-bold text-slate-900 mb-2">
								Payment Successful!
							</h1>
							<p className="text-slate-600">
								Thank you for your purchase. Your payment has been processed
								successfully.
							</p>
						</div>

						{sessionId && (
							<div className="bg-slate-50 rounded-lg p-4 mb-6">
								<p className="text-sm text-slate-500 mb-1">Session ID</p>
								<p className="text-xs font-mono text-slate-700 break-all">
									{sessionId}
								</p>
							</div>
						)}

						<div className="space-y-3">
							<div className="flex items-center justify-center text-sm text-slate-600">
								<Mail className="h-4 w-4 mr-2" />A receipt has been sent to your
								email
							</div>

							<button
								onClick={() => navigate("/")}
								className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Return to Home
							</button>

							<button
								onClick={() => navigate("/orders")}
								className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
							>
								View Order History
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (isCanceled) {
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

	// Fallback for unknown state
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
};

export default ReturnForm;
