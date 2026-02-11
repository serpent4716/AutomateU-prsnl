import numpy as np

# Step activation function (McCulloch–Pitts neuron)
def step(x):
    return 1 if x >= 0 else 0

# XOR and XNOR datasets
X = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
])

xor_target = np.array([0, 1, 1, 0])
xnor_target = np.array([1, 0, 0, 1])

# Learning rate and epochs
eta = 0.1
epochs = 20

# -------------------------
# Hidden Layer (FIXED)
# -------------------------
# Neuron 1 → OR
# Neuron 2 → AND
W_hidden = np.array([
    [1, 1],   # weights for x1
    [1, 1]    # weights for x2
])

b_hidden = np.array([-0.5, -1.5])

def hidden_layer(x):
    h = []
    for j in range(2):
        net = np.dot(x, W_hidden[:, j]) + b_hidden[j]
        h.append(step(net))
    return np.array(h)

# -------------------------
# Train Output Layer
# -------------------------
def train_perceptron(target, gate_name):
    W_out = np.random.uniform(-1, 1, 2)
    b_out = np.random.uniform(-1, 1)

    print(f"\nTraining {gate_name} Gate")

    for epoch in range(epochs):
        total_error = 0
        for i in range(len(X)):
            h = hidden_layer(X[i])
            net = np.dot(h, W_out) + b_out
            y = step(net)
            t = target[i]
            error = t - y

            # Perceptron update rule
            W_out = W_out + eta * error * h
            b_out = b_out + eta * error

            total_error += abs(error)

        if total_error == 0:
            break

    print("Final Weights:", W_out)
    print("Final Bias:", b_out)

    # Testing
    print("Truth Table:")
    for i in range(len(X)):
        h = hidden_layer(X[i])
        y = step(np.dot(h, W_out) + b_out)
        print(f"{X[i]} -> {y}")

# -------------------------
# Run Experiments
# -------------------------
train_perceptron(xor_target, "XOR")
train_perceptron(xnor_target, "XNOR")