import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model

class LSTMAutoencoder:
    """
    Detects gradual behavioral drift — things that change slowly
    over days (slow lateral movement, credential abuse over time).
    """
    def __init__(self, sequence_length=48, n_features=9):
        self.seq_len = sequence_length
        self.n_features = n_features
        self.threshold = None
        self.model = self._build_model()

    def _build_model(self):
        inputs = layers.Input(shape=(self.seq_len, self.n_features))

        encoded = layers.LSTM(64, return_sequences=True)(inputs)
        encoded = layers.LSTM(32, return_sequences=False)(encoded)
        encoded = layers.RepeatVector(self.seq_len)(encoded)

        decoded = layers.LSTM(32, return_sequences=True)(encoded)
        decoded = layers.LSTM(64, return_sequences=True)(decoded)
        decoded = layers.TimeDistributed(layers.Dense(self.n_features))(decoded)

        model = Model(inputs, decoded)
        model.compile(optimizer='adam', loss='mae')
        return model

    def train(self, sequences: np.ndarray, epochs=50):
        """sequences shape: (n_samples, seq_length, n_features)"""
        if sequences.shape[1] != self.seq_len or sequences.shape[2] != self.n_features:
            raise ValueError(f"Expected shape (N, {self.seq_len}, {self.n_features}), got {sequences.shape}")
            
        history = self.model.fit(
            sequences, sequences,
            epochs=epochs,
            batch_size=min(32, len(sequences)),
            validation_split=0.2 if len(sequences) > 1 else 0.0,
            verbose=1
        )
        # Set threshold as 95th percentile of reconstruction error
        reconstructions = self.model.predict(sequences, verbose=0)
        errors = np.mean(np.abs(sequences - reconstructions), axis=(1, 2))
        self.threshold = np.percentile(errors, 95) if len(errors) > 0 else 1.0
        print(f"[LSTM] Threshold set at {self.threshold:.4f}")
        return history

    def score(self, sequence: np.ndarray) -> float:
        """sequence shape: (1, seq_length, n_features)"""
        if self.threshold is None or self.threshold == 0:
            return 0.0
            
        reconstruction = self.model.predict(sequence, verbose=0)
        error = np.mean(np.abs(sequence - reconstruction))
        return min(float(error / self.threshold), 1.0)

    def save(self, path="models/lstm_autoencoder"):
        os.makedirs(path, exist_ok=True)
        self.model.save(path)
        np.save(f"{path}/threshold.npy", self.threshold)

    def load(self, path="models/lstm_autoencoder"):
        self.model = tf.keras.models.load_model(path)
        self.threshold = float(np.load(f"{path}/threshold.npy"))