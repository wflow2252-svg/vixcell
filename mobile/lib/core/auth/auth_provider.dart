import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';

// ─── Auth State ─────────────────────────────────────────────────────────────
class AuthState {
  final bool isLoggedIn;
  final String? token;
  final String? adminName;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isLoggedIn = false,
    this.token,
    this.adminName,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isLoggedIn,
    String? token,
    String? adminName,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      token: token ?? this.token,
      adminName: adminName ?? this.adminName,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ─── Auth Notifier ───────────────────────────────────────────────────────────
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;

  AuthNotifier(this._api) : super(const AuthState()) {
    _loadSavedAuth();
  }

  Future<void> _loadSavedAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final name = prefs.getString('admin_name');
    if (token != null) {
      _api.setToken(token);
      state = AuthState(isLoggedIn: true, token: token, adminName: name);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post(
        ApiEndpoints.login,
        data: {'email': email, 'password': password},
      );

      final token = response.data['data']['token'] as String;
      final name  = response.data['data']['admin']['name'] as String;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      await prefs.setString('admin_name', name);

      _api.setToken(token);
      state = AuthState(isLoggedIn: true, token: token, adminName: name);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('admin_name');
    _api.clearToken();
    state = const AuthState();
  }

  String _parseError(dynamic e) {
    return e.toString().contains('401')
        ? 'Invalid email or password'
        : 'Connection error. Please try again.';
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthNotifier(api);
});
