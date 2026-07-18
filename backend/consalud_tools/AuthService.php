<?php

namespace App\Application\Services\User;

use App\Domain\Entities\User\User;
use App\Domain\Repositories\User\UserRepositoryInterface;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Application\DTOs\User\UserDto;
use App\Domain\Entities\User\User as UserEntity;
use App\Infrastructure\Models\User\User as UserModel;

class AuthService
{
    private $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function login(string $usernameOrEmail, string $password): ?JsonResponse
    {
        // Detectamos si es un email válido o si es un usuario
        $field = filter_var($usernameOrEmail, FILTER_VALIDATE_EMAIL) ? 'email' : 'usuario';

        $credentials = [$field => $usernameOrEmail, 'password' => $password];

        if (! $token = auth('api')->attempt($credentials)) {
            return null;
        }

        /** @var UserModel $userModel */
        $userModel = auth('api')->user();

        // Validar estado
        if ($userModel->estado == 0) {
            auth('api')->logout(); // invalida el token generado
            return response()->json(['error' => 'Usuario inactivo'], 403);
        }        

        return $this->respondWithToken($token);
    }

    protected function respondWithToken($token): JsonResponse
    {
        $guard = auth('api');
        /** @var UserModel $userModel */
        $userModel = $guard->user();
        // /** @var \App\Models\User $user */
        // $user = User::with('role')->find(auth('api')->id());
        if (!$userModel) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Construir la entidad desde el modelo
        $userEntity = new UserEntity(
            $userModel->id,
            $userModel->tipo_id,
            $userModel->identificacion,
            $userModel->primer_nombre,
            $userModel->segundo_nombre,
            $userModel->primer_apellido,
            $userModel->segundo_apellido,
            $userModel->fecha_nacimiento,
            $userModel->celular,
            $userModel->direccion,
            $userModel->usuario,
            $userModel->estado,
            $userModel->role_id,
            $userModel->genero_id,
            $userModel->departamento_id,
            $userModel->municipio_id,
            $userModel->foto,
            $userModel->email,
            $userModel->password
        );

        // Mapear con el DTO para traer todas las relaciones
        $userDto = UserDto::fromEntityWithModel($userEntity, $userModel);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 120,
            'user' => $userDto
        ]);
    }

    public function getAuthenticatedUser(): ?User
    {
        $userModel = auth('api')->user();
        if (!$userModel) return null;

        return new User(
            $userModel->id,
            $userModel->tipo_id,
            $userModel->identificacion,
            $userModel->primer_nombre,
            $userModel->segundo_nombre,
            $userModel->primer_apellido,
            $userModel->segundo_apellido,
            $userModel->fecha_nacimiento,
            $userModel->celular,
            $userModel->direccion,
            $userModel->usuario,
            $userModel->estado,
            $userModel->role_id,
            $userModel->genero_id,
            $userModel->departamento_id,
            $userModel->municipio_id,
            $userModel->foto,
            $userModel->email,
            $userModel->password
        );
    }

    public function logout(): void
    {
        auth()->logout();
    }

    public function refresh()
    {

        $guard = auth('api');

        try {
            $token = JWTAuth::refresh();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al renovar el token.'], 500);
        }

        return $this->respondWithToken($token);
    }

    public function obtenerAsesores(): array
    {
        return $this->userRepository->getAsesores();
    }
}
